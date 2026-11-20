"""Prepara los datos SCADA del parque eólico (2019) para el Laboratorio.

El archivo original de la profesora (MV01-MV25_2019.txt, 280 MB) no se sube al repositorio. Este script lo lee
una sola vez, repara lo que se puede reparar y guarda en assets/datos/viento/:

- scada_mv01_2019_10min.csv.gz   la turbina MV01 con las columnas que usa el análisis (registros de 10 minutos)
- scada_parque_2019_10min.csv.gz viento y potencia de todas las turbinas que trae el archivo (MV01 a MV06)
- muestra_cruda.txt              unas líneas del archivo tal como viene, para el paso de limpieza
- perfil_archivo.json            cuántas líneas de cada tipo tiene el archivo completo

La función leer_linea() es la misma que se explica en el paso de limpieza del Laboratorio.

Uso:  python3 fuente/laboratorio/viento_temario/preparar_datos.py ruta/a/MV01-MV25_2019.txt
"""
import gzip
import json
import re
import sys
from collections import Counter
from pathlib import Path

import pandas as pd

SALIDA = Path(__file__).resolve().parents[3] / "assets" / "datos" / "viento"

# El prefijo de cada línea: las fechas quedaron partidas por comas en lugares fijos
PREFIJO = re.compile(r"^(\d\d/\d\d/\d{4}),([\d:.]+),(MV\d\d),(\d{4}-\d\d-\d\d),(\d\d:\d\d:\d\d),(-?\d+),(-?\d+),"
                     r"(\d{4}-\d\d),?(-?\d\d),(\d\d:\d\d:\d\d),(.*)$")
PEGADO = re.compile(r"(?<=\d)-(?=\d)")        # «6.6999998-20.9»: se perdió la coma antes de un negativo
N_CAMPOS = 166                                # campos desde «Seconds» hasta «ExtraBytes»
ANCLA = 131                                   # AltWindSpeedSource: repite el nombre de la turbina

COLUMNAS = {  # posición (desde «Seconds») → nombre en el análisis
    16: "TurbineState", 19: "FaultCode", 22: "BaroPressMean", 23: "NacTempMean", 25: "GBOilTempMean",
    26: "BrgTemp1Mean", 31: "GenTemp1Mean", 35: "AmbTempMean", 38: "WindSpdMean", 39: "WindSpdSdev",
    40: "WindSpdMin", 41: "WindSpdMax", 42: "RealPowerMean", 43: "RealPowerSdev", 46: "ReactivePowerMean",
    50: "RealPowerLimitMean", 54: "PitchPos1Mean", 66: "GenSpdMean", 70: "HubSpdMean", 75: "YawPosMean",
    76: "YawErrMean", 77: "AirDensityMean", 128: "OpStatusCode",
    135: "ExpectedEnergy", 136: "LostEnergy", 144: "DeltaRunState", 145: "DeltaFault", 153: "WindDirMean"}


def leer_linea(linea):
    """Devuelve (estado, registro) de una línea del archivo crudo.

    estado: «vacía», «completa», «reparada» (se restituyeron comas perdidas), «parcial» (solo valen las columnas
    anteriores a la ancla), «truncada» (la línea se cortó: solo quedan las primeras columnas) o «ilegible» (se
    conservan las fechas, pero ningún valor es confiable).
    """
    linea = linea.rstrip("\r\n")
    if not linea.strip("\t ,"):
        return "vacía", None
    m = PREFIJO.match(linea)
    if not m:
        return "ilegible", None
    dev = m.group(3)
    reg = {"ts_utc": f"{m.group(4)} {m.group(5)}", "ts_local": f"{m.group(8)}{m.group(9)} {m.group(10)}",
           "device": dev}
    campos = m.group(11).split(",")
    estado = "completa"
    if len(campos) != N_CAMPOS:
        reparados = PEGADO.sub(",-", m.group(11)).split(",")
        if len(reparados) == N_CAMPOS:
            campos, estado = reparados, "reparada"
        elif len(campos) > ANCLA and campos[ANCLA] == dev:
            estado = "parcial"
        elif len(linea) <= 330:
            estado = "truncada"
            campos = campos[:-1]               # el último campo quedó cortado a la mitad
        else:
            estado = "ilegible"                # se perdió una coma sin pista: no se puede saber qué valor es cuál
    limite = {"parcial": ANCLA, "truncada": len(campos), "ilegible": 0}.get(estado, N_CAMPOS)
    for pos, nombre in COLUMNAS.items():
        valor = campos[pos] if pos < limite and pos < len(campos) else ""
        try:
            reg[nombre] = float(valor) if valor != "" else None
        except ValueError:
            reg[nombre] = None
    reg["fila"] = estado
    return estado, reg


def main(ruta):
    SALIDA.mkdir(parents=True, exist_ok=True)
    conteo, por_turbina, registros = Counter(), Counter(), []
    muestra, vistos = [], Counter()
    with open(ruta, encoding="ascii", errors="replace") as fh:
        cabecera = fh.readline().rstrip("\r\n")
        for linea in fh:
            estado, reg = leer_linea(linea)
            conteo[estado] += 1
            if reg:
                por_turbina[(reg["device"], estado)] += 1
                registros.append(reg)
            # Muestra cruda: algunas líneas de cada tipo, de la turbina MV01 y unas vacías
            if (estado == "vacía" or (reg and reg["device"] == "MV01")) and vistos[estado] < 4:
                vistos[estado] += 1
                muestra.append(linea.rstrip("\r\n"))
    df = pd.DataFrame(registros)
    redondeo = {c: 3 for c in COLUMNAS.values()}
    redondeo.update({"WindSpdMean": 2, "WindSpdSdev": 2, "WindSpdMin": 2, "WindSpdMax": 2, "RealPowerMean": 1,
                     "RealPowerSdev": 1, "ReactivePowerMean": 1})
    df = df.round(redondeo)
    mv01 = df[df["device"] == "MV01"].drop(columns="device")
    mv01.to_csv(SALIDA / "scada_mv01_2019_10min.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})
    df[["ts_utc", "device", "WindSpdMean", "RealPowerMean", "fila"]].to_csv(
        SALIDA / "scada_parque_2019_10min.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})
    (SALIDA / "muestra_cruda.txt").write_text(cabecera + "\n" + "\n".join(muestra) + "\n", encoding="utf-8")
    perfil = {"lineas": sum(conteo.values()) + 1, "por_estado": dict(conteo),
              "turbinas": sorted(df["device"].unique().tolist()),
              "por_turbina": {f"{d}|{e}": n for (d, e), n in sorted(por_turbina.items())}}
    (SALIDA / "perfil_archivo.json").write_text(json.dumps(perfil, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(perfil, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "MV01-MV25_2019.txt")

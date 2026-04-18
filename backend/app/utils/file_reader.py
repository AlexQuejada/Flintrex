"""
Utilidades para lectura robusta de archivos CSV y Excel.
"""
import io
import pandas as pd
from typing import Optional


async def read_csv_robust(contents: bytes) -> Optional[pd.DataFrame]:
    """
    Lee un CSV probando múltiples codificaciones y separadores.
    Retorna None si no puede leer el archivo.
    """
    encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    separators = [',', ';', '\t', '|']

    for enc in encodings:
        for sep in separators:
            try:
                content = contents
                # Detectar y remover BOM
                if content.startswith(b'\xef\xbb\xbf'):
                    content = content[3:]

                df = pd.read_csv(
                    io.BytesIO(content),
                    encoding=enc,
                    sep=sep,
                    engine='python',
                    on_bad_lines='skip'
                )
                if df is not None and len(df.columns) > 0:
                    return df
            except Exception:
                continue

    return None


async def read_excel_robust(contents: bytes) -> Optional[pd.DataFrame]:
    """
    Lee un archivo Excel (.xlsx o .xls).
    Retorna None si no puede leer el archivo.
    """
    try:
        df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
        return df
    except Exception:
        try:
            df = pd.read_excel(io.BytesIO(contents))
            return df
        except Exception:
            return None


async def read_file(contents: bytes, filename: str) -> Optional[pd.DataFrame]:
    """
    Lee CSV o Excel de forma robusta según la extensión del archivo.
    """
    filename_lower = filename.lower()

    if filename_lower.endswith('.csv'):
        return await read_csv_robust(contents)

    elif filename_lower.endswith(('.xlsx', '.xls')):
        return await read_excel_robust(contents)

    return None

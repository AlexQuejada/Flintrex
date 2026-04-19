"""
Utilidades para lectura robusta de archivos CSV y Excel.
"""
import io
import pandas as pd
from typing import Optional


async def read_csv_robust(contents: bytes) -> Optional[pd.DataFrame]:
    """
    Lee un CSV probando múltiples codificaciones y separadores.
    Detecta automaticamente el separador basado en el contenido.
    """
    encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    separators = [',', ';', '\t', '|']

    # Detectar y remover BOM
    content = contents
    if content.startswith(b'\xef\xbb\xbf'):
        content = content[3:]

    for enc in encodings:
        try:
            # Intento 1: Dejar que pandas detecte automaticamente el separador
            try:
                df = pd.read_csv(
                    io.BytesIO(content),
                    encoding=enc,
                    sep=None,  # pandas detecta automaticamente
                    engine='python',
                    on_bad_lines='skip'
                )
                if df is not None and len(df.columns) > 1:
                    return df
            except Exception:
                pass

            # Intento 2: Probar separadores especificos
            for sep in separators:
                try:
                    df = pd.read_csv(
                        io.BytesIO(content),
                        encoding=enc,
                        sep=sep,
                        engine='python',
                        on_bad_lines='skip'
                    )
                    if df is not None and len(df.columns) > 1:
                        return df
                except Exception:
                    continue

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
    Lee CSV o Excel de forma robusta segun la extension del archivo.
    """
    filename_lower = filename.lower()

    if filename_lower.endswith('.csv'):
        return await read_csv_robust(contents)

    elif filename_lower.endswith(('.xlsx', '.xls')):
        return await read_excel_robust(contents)

    return None

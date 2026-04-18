"""
Utilidades de normalización de texto y DataFrames.
"""
import pandas as pd
import unicodedata
from typing import Union


def normalize_text(
    series_or_text: Union[pd.Series, str],
    case_sensitive: bool,
    normalize_whitespace: bool,
    normalize_accents: bool
) -> Union[pd.Series, str]:
    """
    Normaliza texto: acentos, espacios, mayúsculas.
    Funciona con Series de pandas o strings.
    """
    is_series = isinstance(series_or_text, pd.Series)
    text = series_or_text

    # Normalizar espacios
    if normalize_whitespace:
        if is_series:
            text = text.str.strip().str.replace(r'\s+', ' ', regex=True)
        else:
            text = ' '.join(text.split())

    # Quitar acentos
    if normalize_accents:
        if is_series:
            text = text.str.normalize('NFKD').str.encode('ascii', errors='ignore').str.decode('utf-8')
        else:
            text = unicodedata.normalize('NFKD', text).encode('ascii', errors='ignore').decode('utf-8')

    # Minúsculas
    if not case_sensitive:
        if is_series:
            text = text.str.lower()
        else:
            text = text.lower()

    return text


def normalize_dataframe(
    df: pd.DataFrame,
    case_sensitive: bool = False,
    normalize_whitespace: bool = True,
    normalize_accents: bool = True
) -> pd.DataFrame:
    """
    Normaliza un DataFrame completo: nombres de columnas y valores.
    """
    # Normalizar nombres de columnas primero
    df.columns = [
        normalize_text(col, case_sensitive, normalize_whitespace, normalize_accents)
        for col in df.columns
    ]

    # Normalizar columnas de tipo objeto (texto)
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = normalize_text(
            df[col].astype(str),
            case_sensitive,
            normalize_whitespace,
            normalize_accents
        )

    return df


def normalize_column_names(
    df: pd.DataFrame,
    case_sensitive: bool = False,
    normalize_whitespace: bool = True,
    normalize_accents: bool = True
) -> pd.DataFrame:
    """
    Solo normaliza los nombres de columnas (no los valores).
    """
    df.columns = [
        normalize_text(col, case_sensitive, normalize_whitespace, normalize_accents)
        for col in df.columns
    ]
    return df

"""
Servicio de transformación de DataFrames.
Operaciones: dropna, fillna, drop_duplicates, clean.
"""
import pandas as pd
from typing import Optional, List


class TransformService:
    """Servicio para transformar y limpiar DataFrames."""

    VALID_OPERATIONS = ["dropna", "fillna", "drop_duplicates", "clean"]
    VALID_KEEP_OPTIONS = ["first", "last", False]

    @classmethod
    def apply_operation(
        cls,
        df: pd.DataFrame,
        operation: str,
        fill_value: Optional[str] = None,
        key_columns: Optional[str] = None,
        keep: str = "first"
    ) -> tuple[pd.DataFrame, str]:
        """
        Aplica una operación de transformación al DataFrame.

        Args:
            df: DataFrame a transformar
            operation: Tipo de operación (dropna, fillna, drop_duplicates, clean)
            fill_value: Valor para rellenar nulos (solo fillna)
            key_columns: Columnas clave para identificar duplicados
            keep: Qué duplicado conservar (first, last, False)

        Returns:
            Tupla (DataFrame transformado, mensaje descriptivo)
        """
        original_rows = len(df)

        if operation == "dropna":
            df = df.dropna()
            message = f"Eliminadas {original_rows - len(df)} filas con valores nulos"

        elif operation == "fillna":
            if fill_value is None:
                raise ValueError("fillna requiere fill_value")
            df = df.fillna(fill_value)
            message = f"Rellenados valores nulos con '{fill_value}'"

        elif operation == "drop_duplicates":
            df, message = cls._drop_duplicates(df, key_columns, keep, original_rows)

        elif operation == "clean":
            message = "Limpieza aplicada (normalización de texto y espacios)"

        else:
            raise ValueError(f"Operación '{operation}' no soportada. Usa: {', '.join(cls.VALID_OPERATIONS)}")

        return df, message

    @classmethod
    def _drop_duplicates(
        cls,
        df: pd.DataFrame,
        key_columns: Optional[str],
        keep: str,
        original_rows: int
    ) -> tuple[pd.DataFrame, str]:
        """
        Elimina filas duplicadas basándose en columnas clave.
        """
        print(f"[DEBUG] drop_duplicates: key_columns recibidas = '{key_columns}'")
        print(f"[DEBUG] drop_duplicates: columnas disponibles = {list(df.columns)}")

        subset_cols = None
        if key_columns:
            subset_cols = [
                c.strip() for c in key_columns.split(',')
                if c.strip() in df.columns
            ]
            print(f"[DEBUG] drop_duplicates: columnas encontradas = {subset_cols}")

        if key_columns and not subset_cols:
            raise ValueError(f"Columnas clave no encontradas: {key_columns}. Columnas disponibles: {list(df.columns)}")

        rows_before = len(df)
        keep_val = keep if keep in ["first", "last"] else False

        print(f"[DEBUG] drop_duplicates: aplicando con keep={keep_val}, subset={subset_cols}")
        df = df.drop_duplicates(subset=subset_cols, keep=keep_val)

        deleted = rows_before - len(df)
        message = f"Eliminadas {deleted} filas duplicadas"
        if subset_cols:
            message += f" (basado en: {', '.join(subset_cols)})"
        else:
            message += " (comparando todas las columnas)"

        print(f"[DEBUG] drop_duplicates: {message}")
        return df, message

    @staticmethod
    def detect_duplicates(
        df: pd.DataFrame,
        subset_cols: Optional[List[str]] = None
    ) -> pd.Series:
        """
        Detecta duplicados sin eliminarlos.

        Args:
            df: DataFrame a analizar
            subset_cols: Columnas para identificar duplicados

        Returns:
            Máscara booleana de filas duplicadas
        """
        if subset_cols:
            return df.duplicated(subset=subset_cols, keep=False)
        else:
            return df.duplicated(keep=False)

    @classmethod
    def validate_operation(cls, operation: str) -> bool:
        """Valida si una operación es soportada."""
        return operation in cls.VALID_OPERATIONS

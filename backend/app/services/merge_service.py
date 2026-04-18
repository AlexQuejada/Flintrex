"""
Servicio de merge de DataFrames.
Implementa union vertical (concat) y join horizontal (merge tipo SQL).
"""
import pandas as pd
from typing import List, Optional, Set, Dict
import re


class MergeService:
    """Servicio para combinar múltiples DataFrames."""

    # Patrones para detectar columnas clave (usando re.search para buscar en cualquier posicion)
    KEY_PATTERNS = [
        r'^id$',                # "id" exacto
        r'._id$',               # termina en _id (cliente_id, user_id)
        r'^code',               # empieza con code
        r'._code$',             # termina en _code
        r'^email$',             # email
        r'^correo$',            # correo
        r'^phone$',             # phone
        r'^telefono$',          # telefono
        r'^celular$',           # celular
        r'^dni$',               # DNI
        r'^ruc$',               # RUC
        r'^nit$',               # NIT
    ]

    # Mapeo de sinónimos de columnas comunes → nombre estándar
    COLUMN_SYNONYMS: Dict[str, List[str]] = {
        'nombre': ['nombre', 'full_name', 'nombre_completo', 'nombre_completo', 'cliente_nombre', 'name', 'first_name', 'apellido', 'apellidos', 'last_name', 'surname', 'razon_social'],
        'email': ['email', 'correo', 'correo_electronico', 'correo_electronico', 'e_mail', 'mail', 'email_cliente'],
        'telefono': ['telefono', 'phone', 'celular', 'mobile', 'telefono_cliente', 'numero_telefono', 'numero_celular', 'tel'],
        'direccion': ['direccion', 'address', 'direccion_cliente', 'calle', 'avenida', 'domicilio', 'ubicacion'],
        'ciudad': ['ciudad', 'city', 'municipio', 'provincia', 'localidad', 'comuna'],
        'pais': ['pais', 'country', 'nacion'],
        'id_cliente': ['id_cliente', 'cliente_id', 'user_id', 'customer_id', 'id_usuario', 'codigo_cliente', 'cliente_codigo', 'id'],
        'fecha_registro': ['fecha_registro', 'fecha_registro', 'created_at', 'registration_date', 'fecha_creacion', 'fecha_alta'],
        'total_compras': ['total_compras', 'total_compras', 'total', 'monto_total', 'amount', 'valor_total', 'compras_total'],
        'notas': ['notas', 'notes', 'observaciones', 'comentarios', 'descripcion', 'memo'],
    }

    VALID_JOIN_TYPES = ["inner", "outer", "left", "right"]

    @classmethod
    def normalize_columns(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normaliza los nombres de columnas a nombres estándar basándose en sinónimos.
        Ejemplo: 'nombre', 'full_name', 'nombre_completo' → todas se convierten a 'nombre'
        """
        column_mapping = {}

        for col in df.columns:
            col_lower = col.lower().strip().replace(' ', '_').replace('-', '_')
            matched = False

            for standard_name, synonyms in cls.COLUMN_SYNONYMS.items():
                if col_lower in synonyms:
                    column_mapping[col] = standard_name
                    matched = True
                    break

        if column_mapping:
            df = df.rename(columns=column_mapping)

        return df

    @staticmethod
    def detect_merge_mode(
        dataframes: List[pd.DataFrame],
        key_cols: Optional[List[str]],
        common_columns: Set[str]
    ) -> str:
        """
        Detecta automáticamente el mejor modo de merge.

        Reglas:
        1. Si se proporcionaron key_columns y existen en todos → JOIN
        2. Si todos tienen exactamente las mismas columnas → UNION
        3. Si hay columnas candidatas a clave → JOIN
        4. Default → UNION
        """
        if not dataframes or len(dataframes) < 2:
            return "union"

        # Regla 1: key_columns explícitas proporcionadas
        if key_cols:
            all_have_keys = all(
                all(k in df.columns for k in key_cols)
                for df in dataframes
            )
            if all_have_keys:
                return "join"

        # Regla 2: Mismo esquema exacto → UNION
        first_cols = set(dataframes[0].columns)
        all_same = all(set(df.columns) == first_cols for df in dataframes)
        if all_same:
            return "union"

        # Regla 3: Buscar columnas candidatas a clave
        candidates = MergeService._infer_key_columns(common_columns)
        if candidates:
            return "join"

        # Default: UNION
        return "union"

    @staticmethod
    def _infer_key_columns(common_columns: Set[str]) -> List[str]:
        """
        Intenta inferir qué columnas podrían ser clave para un JOIN.
        Busca nombres típicos de ID.
        """
        if not common_columns:
            return []

        candidates = []
        for col in common_columns:
            col_lower = col.lower()
            for pattern in MergeService.KEY_PATTERNS:
                if re.search(pattern, col_lower):
                    candidates.append(col)
                    break

        return candidates

    @classmethod
    def perform_union(cls, dataframes: List[pd.DataFrame]) -> pd.DataFrame:
        """
        Realiza unión vertical (concatenación) de DataFrames.
        """
        if len(dataframes) < 2:
            return dataframes[0] if dataframes else pd.DataFrame()

        return pd.concat(dataframes, ignore_index=True)

    @classmethod
    def perform_join(
        cls,
        dataframes: List[pd.DataFrame],
        key_cols: List[str],
        join_type: str = "inner"
    ) -> pd.DataFrame:
        """
        Realiza joins sucesivos entre múltiples DataFrames.

        Args:
            dataframes: Lista de DataFrames a unir
            key_cols: Columnas clave para el join
            join_type: Tipo de join (inner, outer, left, right)

        Returns:
            DataFrame resultante del join
        """
        if len(dataframes) < 2:
            return dataframes[0] if dataframes else pd.DataFrame()

        # Validar tipo de join
        if join_type not in cls.VALID_JOIN_TYPES:
            join_type = "inner"

        # Empezar con el primer dataframe
        result = dataframes[0].copy()

        # Agregar sufijos para evitar colisiones de nombres
        for i, df in enumerate(dataframes[1:], start=1):
            df_copy = df.copy()

            # Identificar columnas duplicadas (excepto las claves)
            dup_cols = [
                c for c in df_copy.columns
                if c in result.columns and c not in key_cols
            ]

            if dup_cols:
                # Renombrar columnas duplicadas
                rename_map = {c: f"{c}_{i}" for c in dup_cols}
                df_copy = df_copy.rename(columns=rename_map)

            result = result.merge(df_copy, on=key_cols, how=join_type)

        return result

    @staticmethod
    def add_source_column(
        df: pd.DataFrame,
        filenames: List[str],
        row_counts: List[int],
        mode: str
    ) -> pd.DataFrame:
        """
        Agrega columna de trazabilidad __source_file__.

        En modo union: cada fila tiene el nombre de su archivo origen.
        En modo join: marca como archivo base.
        """
        if mode == "union":
            source_col = []
            for filename, count in zip(filenames, row_counts):
                source_col.extend([filename] * count)
            df['__source_file__'] = source_col
        else:
            # En join, marcar como archivo base
            df['__source_file__'] = filenames[0] + " (base)"

        return df

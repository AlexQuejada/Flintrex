"""
Tests para transformaciones de datos
Prueba las operaciones: dropna, fillna, drop_duplicates, clean
"""

import pytest
import pandas as pd
import sys
import os

# Agregar backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.v1.endpoints.data import _normalize_df


class TestNormalizeDF:
    """Tests para la funcion de normalizacion _normalize_df"""

    def test_normalize_whitespace(self):
        """Prueba que elimina espacios extra"""
        df = pd.DataFrame({
            'nombre': ['  Jose  ', 'Maria   ', '  Pedro'],
            'email': ['jose@test.com', 'maria@test.com', 'pedro@test.com']
        })

        result = _normalize_df(df.copy(), case_sensitive=True, normalize_whitespace=True, normalize_accents=False)

        assert result['nombre'].iloc[0] == 'Jose'
        assert result['nombre'].iloc[1] == 'Maria'
        assert result['nombre'].iloc[2] == 'Pedro'

    def test_normalize_accents(self):
        """Prueba que elimina acentos"""
        df = pd.DataFrame({
            'nombre': ['José', 'María', 'Pedro'],
            'email': ['jose@test.com', 'maria@test.com', 'pedro@test.com']
        })

        result = _normalize_df(df.copy(), case_sensitive=True, normalize_whitespace=False, normalize_accents=True)

        assert result['nombre'].iloc[0] == 'Jose'
        assert result['nombre'].iloc[1] == 'Maria'
        assert result['nombre'].iloc[2] == 'Pedro'

    def test_case_insensitive(self):
        """Prueba que convierte a minusculas"""
        df = pd.DataFrame({
            'nombre': ['JOSE', 'Maria', 'PEDRO'],
            'email': ['JOSE@TEST.COM', 'MARIA@TEST.COM', 'PEDRO@TEST.COM']
        })

        result = _normalize_df(df.copy(), case_sensitive=False, normalize_whitespace=False, normalize_accents=False)

        assert result['nombre'].iloc[0] == 'jose'
        assert result['nombre'].iloc[1] == 'maria'
        assert result['nombre'].iloc[2] == 'pedro'
        assert result['email'].iloc[0] == 'jose@test.com'

    def test_combined_normalization(self):
        """Prueba normalizacion completa"""
        df = pd.DataFrame({
            'nombre': ['  JOSÉ  ', 'maría', '  PEDRO  '],
            'email': ['JOSE@TEST.COM', '  MARIA@TEST.COM  ', 'pedro@test.com']
        })

        result = _normalize_df(df.copy(), case_sensitive=False, normalize_whitespace=True, normalize_accents=True)

        assert result['nombre'].iloc[0] == 'jose'
        assert result['nombre'].iloc[1] == 'maria'
        assert result['nombre'].iloc[2] == 'pedro'


class TestDropDuplicatesLogic:
    """Tests para logica de eliminacion de duplicados"""

    def test_drop_duplicates_all_columns(self, dataframe_con_duplicados):
        """Prueba eliminar duplicados considerando todas las columnas"""
        df = dataframe_con_duplicados
        original_len = len(df)

        result = df.drop_duplicates()

        assert len(result) == original_len - 1

    def test_drop_duplicates_by_key_column(self, dataframe_con_duplicados):
        """Prueba eliminar duplicados por columna clave"""
        df = dataframe_con_duplicados

        result = df.drop_duplicates(subset=['cliente_id'])

        assert len(result) == 4

    def test_drop_duplicates_respect_other_columns(self, dataframe_con_duplicados):
        """Prueba que no elimina filas si solo coinciden en algunas columnas"""
        df = dataframe_con_duplicados

        result = df.drop_duplicates(subset=['direccion'])

        assert len(result) == 4


class TestDropNaLogic:
    """Tests para logica de eliminacion de nulos"""

    def test_dropna_any(self, dataframe_con_nulos):
        """Prueba eliminar filas con cualquier nulo"""
        df = dataframe_con_nulos

        result = df.dropna()

        # Solo la primera fila esta completa (cliente_id=1, nombre=José, email=jose@test.com)
        assert len(result) == 1
        assert result['cliente_id'].iloc[0] == 1

    def test_dropna_subset(self, dataframe_con_nulos):
        """Prueba eliminar filas con nulos solo en columnas especificas"""
        df = dataframe_con_nulos

        result = df.dropna(subset=['cliente_id', 'nombre'])

        # Filas con cliente_id y nombre no nulos
        assert len(result) == 1


class TestFillNaLogic:
    """Tests para logica de rellenado de nulos"""

    def test_fillna_value(self, dataframe_con_nulos):
        """Prueba rellenar nulos con un valor especifico"""
        df = dataframe_con_nulos

        result = df.fillna('SIN_VALOR')

        assert result['nombre'].iloc[1] == 'SIN_VALOR'
        assert result['email'].iloc[1] == 'SIN_VALOR'

    def test_fillna_numeric(self):
        """Prueba rellenar nulos en columnas numericas"""
        df = pd.DataFrame({
            'cliente_id': [1, 2, None, 4],
            'monto': [100, None, 300, None]
        })

        result = df.fillna(0)

        assert result['cliente_id'].iloc[2] == 0
        assert result['monto'].iloc[1] == 0
        assert result['monto'].iloc[3] == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
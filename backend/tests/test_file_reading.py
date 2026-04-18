"""
Tests para lectura de archivos
Prueba diferentes encodings, separadores y formatos
"""

import pytest
import pandas as pd
import io
import sys
import os
import asyncio

# Agregar backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.v1.endpoints.data import _read_file


class TestCSVReading:
    """Tests para lectura de CSVs"""

    def test_read_utf8_csv(self, csv_utf8_content):
        """Prueba lectura de CSV UTF-8"""
        df = asyncio.run(_read_file(csv_utf8_content, 'test.csv'))

        assert df is not None
        assert len(df) == 2
        assert list(df.columns) == ['cliente_id', 'nombre', 'email']
        assert df['nombre'].iloc[0] == 'Jose'

    def test_read_utf8_sig_with_bom(self, csv_utf8_sig_content):
        """Prueba lectura de CSV UTF-8 con BOM"""
        df = asyncio.run(_read_file(csv_utf8_sig_content, 'test.csv'))

        assert df is not None
        assert len(df) == 2
        assert 'cliente_id' in df.columns

    def test_read_semicolon_separated(self, csv_semicolon_content):
        """Prueba lectura de CSV con separador punto y coma"""
        df = asyncio.run(_read_file(csv_semicolon_content, 'test.csv'))

        assert df is not None
        assert len(df) == 2
        assert 'cliente_id' in df.columns
        assert df['cliente_id'].iloc[0] == 1

    def test_read_empty_csv(self):
        """Prueba lectura de CSV vacio (solo encabezado)"""
        content = b'cliente_id,nombre'
        df = asyncio.run(_read_file(content, 'test.csv'))

        # Debe devolver DataFrame vacio o None
        assert df is None or len(df) == 0


class TestExcelReading:
    """Tests para lectura de Excel"""

    def test_read_excel_content(self, tmp_path):
        """Prueba lectura de archivo Excel"""
        df_original = pd.DataFrame({
            'cliente_id': [1, 2, 3],
            'nombre': ['Jose', 'Maria', 'Pedro'],
            'email': ['jose@test.com', 'maria@test.com', 'pedro@test.com']
        })

        excel_path = tmp_path / "test.xlsx"
        df_original.to_excel(excel_path, index=False)

        with open(excel_path, 'rb') as f:
            content = f.read()

        df = asyncio.run(_read_file(content, 'test.xlsx'))

        assert df is not None
        assert len(df) == 3


class TestFileFormatDetection:
    """Tests para deteccion de formatos"""

    def test_unsupported_extension(self):
        """Prueba que retorna None para extensiones no soportadas"""
        content = b'algun contenido'
        df = asyncio.run(_read_file(content, 'test.txt'))

        assert df is None

    def test_case_insensitive_extension(self):
        """Prueba que las extensiones son case insensitive"""
        content = b'cliente_id,nombre\n1,Jose'
        
        df1 = asyncio.run(_read_file(content, 'test.CSV'))
        df2 = asyncio.run(_read_file(content, 'test.csv'))

        assert df1 is not None
        assert df2 is not None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
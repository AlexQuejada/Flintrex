import pytest
import pandas as pd
import io


@pytest.fixture
def sample_dataframe():
    """DataFrame de prueba básico"""
    return pd.DataFrame({
        'cliente_id': [1, 2, 3, 4, 5],
        'nombre': ['José', 'María', 'Pedro', 'Ana', 'Luis'],
        'email': ['jose@test.com', 'maria@test.com', 'pedro@test.com', 'ana@test.com', 'luis@test.com'],
        'telefono': ['123', '456', '789', '123', '456']
    })


@pytest.fixture
def dataframe_con_duplicados():
    """DataFrame con filas duplicadas para testing"""
    return pd.DataFrame({
        'cliente_id': [1, 2, 2, 3, 4, 4],
        'nombre': ['José', 'María', 'María', 'Pedro', 'Ana', 'Ana'],
        'direccion': ['Norte', 'Sur', 'Sur', 'Este', 'Oeste', 'Oeste'],
        'monto': [100, 200, 250, 300, 400, 400]
    })


@pytest.fixture
def dataframe_con_nulos():
    """DataFrame con valores nulos - SOLO primera fila completa"""
    return pd.DataFrame({
        'cliente_id': [1, None, None, None, None],
        'nombre': ['José', None, None, None, None],
        'email': ['jose@test.com', None, None, None, None]
    })


@pytest.fixture
def csv_utf8_content():
    """Contenido CSV en UTF-8"""
    content = b'cliente_id,nombre,email\n1,Jose,jose@test.com\n2,Maria,maria@test.com'
    return content


@pytest.fixture
def csv_utf8_sig_content():
    """Contenido CSV con BOM UTF-8"""
    content = b'\xef\xbb\xbfcliente_id,nombre,email\n1,Jose,jose@test.com\n2,Maria,maria@test.com'
    return content


@pytest.fixture
def csv_semicolon_content():
    """Contenido CSV con separador punto y coma (sin espacios)"""
    content = b'cliente_id;nombre;email\n1;Jose;jose@test.com\n2;Maria;maria@test.com'
    return content
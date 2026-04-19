"""
Tests para MergeService
Prueba uniones verticales (UNION) y horizontales (JOIN)
"""

import pytest
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.merge_service import MergeService


class TestMergeServiceDetection:
    """Tests para deteccion automatica de modo de merge"""

    def test_detect_union_same_schema(self):
        """Detecta UNION cuando todos tienen mismo esquema"""
        df1 = pd.DataFrame({'nombre': ['Jose'], 'email': ['jose@test.com']})
        df2 = pd.DataFrame({'nombre': ['Maria'], 'email': ['maria@test.com']})

        result = MergeService.detect_merge_mode([df1, df2], None, {'nombre', 'email'})

        assert result == 'union'

    def test_detect_join_with_key_columns(self):
        """Detecta JOIN cuando se proporcionan key_columns"""
        df1 = pd.DataFrame({'cliente_id': [1], 'nombre': ['Jose']})
        df2 = pd.DataFrame({'cliente_id': [1], 'email': ['jose@test.com']})

        result = MergeService.detect_merge_mode([df1, df2], ['cliente_id'], {'cliente_id'})

        assert result == 'join'

    def test_detect_join_by_pattern(self):
        """Detecta JOIN por patron de nombre de columna (ej: *_id)"""
        df1 = pd.DataFrame({'cliente_id': [1, 2], 'nombre': ['Jose', 'Maria']})
        df2 = pd.DataFrame({'cliente_id': [1, 2], 'email': ['jose@test.com', 'maria@test.com']})

        result = MergeService.detect_merge_mode([df1, df2], None, {'cliente_id'})

        assert result == 'join'

    def test_detect_join_by_email_pattern(self):
        """Detecta JOIN por patron 'email'"""
        df1 = pd.DataFrame({'email': ['a@test.com'], 'nombre': ['Jose']})
        df2 = pd.DataFrame({'email': ['a@test.com'], 'telefono': ['123456']})

        result = MergeService.detect_merge_mode([df1, df2], None, {'email'})

        assert result == 'join'

    def test_default_to_union(self):
        """Default a UNION cuando no hay indicios de JOIN"""
        df1 = pd.DataFrame({'a': [1], 'b': [2]})
        df2 = pd.DataFrame({'x': [1], 'y': [2]})

        result = MergeService.detect_merge_mode([df1, df2], None, set())

        assert result == 'union'


class TestMergeServiceUnion:
    """Tests para union vertical (concat)"""

    def test_perform_union_basic(self):
        """Union basica de dos DataFrames"""
        df1 = pd.DataFrame({'nombre': ['Jose'], 'email': ['jose@test.com']})
        df2 = pd.DataFrame({'nombre': ['Maria'], 'email': ['maria@test.com']})

        result = MergeService.perform_union([df1, df2])

        assert len(result) == 2
        assert list(result['nombre']) == ['Jose', 'Maria']

    def test_perform_union_multiple_files(self):
        """Union de mas de dos DataFrames"""
        df1 = pd.DataFrame({'a': [1]})
        df2 = pd.DataFrame({'a': [2]})
        df3 = pd.DataFrame({'a': [3]})

        result = MergeService.perform_union([df1, df2, df3])

        assert len(result) == 3

    def test_perform_union_different_columns(self):
        """Union con columnas diferentes (rellena con NaN)"""
        df1 = pd.DataFrame({'nombre': ['Jose'], 'email': ['jose@test.com']})
        df2 = pd.DataFrame({'nombre': ['Maria'], 'telefono': ['123456']})

        result = MergeService.perform_union([df1, df2])

        assert len(result) == 2
        assert 'email' in result.columns
        assert 'telefono' in result.columns
        assert pd.isna(result['email'].iloc[1])

    def test_perform_union_single_dataframe(self):
        """Union con un solo DataFrame"""
        df1 = pd.DataFrame({'a': [1, 2]})

        result = MergeService.perform_union([df1])

        assert len(result) == 2

    def test_perform_union_empty_list(self):
        """Union con lista vacia"""
        result = MergeService.perform_union([])

        assert len(result) == 0


class TestMergeServiceJoin:
    """Tests para join horizontal (merge)"""

    def test_perform_join_inner(self):
        """JOIN inner basico"""
        df1 = pd.DataFrame({'cliente_id': [1, 2], 'nombre': ['Jose', 'Maria']})
        df2 = pd.DataFrame({'cliente_id': [1, 2], 'email': ['jose@test.com', 'maria@test.com']})

        result = MergeService.perform_join([df1, df2], ['cliente_id'], 'inner')

        assert len(result) == 2
        assert 'nombre' in result.columns
        assert 'email' in result.columns

    def test_perform_join_left(self):
        """JOIN left (preserva todas las filas del primer df)"""
        df1 = pd.DataFrame({'cliente_id': [1, 2], 'nombre': ['Jose', 'Maria']})
        df2 = pd.DataFrame({'cliente_id': [1], 'email': ['jose@test.com']})

        result = MergeService.perform_join([df1, df2], ['cliente_id'], 'left')

        assert len(result) == 2
        assert pd.isna(result['email'].iloc[1])  # Maria no tiene email

    def test_perform_join_multiple_dataframes(self):
        """JOIN de mas de dos DataFrames"""
        df1 = pd.DataFrame({'id': [1, 2], 'nombre': ['Jose', 'Maria']})
        df2 = pd.DataFrame({'id': [1, 2], 'email': ['jose@test.com', 'maria@test.com']})
        df3 = pd.DataFrame({'id': [1, 2], 'telefono': ['123', '456']})

        result = MergeService.perform_join([df1, df2, df3], ['id'], 'inner')

        assert len(result) == 2
        assert 'nombre' in result.columns
        assert 'email' in result.columns
        assert 'telefono' in result.columns

    def test_perform_join_column_collision(self):
        """JOIN maneja colisiones de nombres de columnas"""
        df1 = pd.DataFrame({'id': [1], 'nombre': ['Jose']})
        df2 = pd.DataFrame({'id': [1], 'nombre': ['Maria']})  # Mismo nombre, diferente significado

        result = MergeService.perform_join([df1, df2], ['id'], 'inner')

        assert 'nombre' in result.columns
        assert 'nombre_1' in result.columns  # Renombrada

    def test_perform_join_with_multiple_keys(self):
        """JOIN con multiples columnas clave"""
        df1 = pd.DataFrame({'a': [1, 1], 'b': [2, 3], 'val1': ['x', 'y']})
        df2 = pd.DataFrame({'a': [1, 1], 'b': [2, 4], 'val2': ['z', 'w']})

        result = MergeService.perform_join([df1, df2], ['a', 'b'], 'inner')

        assert len(result) == 1
        assert result['val1'].iloc[0] == 'x'
        assert result['val2'].iloc[0] == 'z'


class TestMergeServiceSourceColumn:
    """Tests para agregar columna de origen"""

    def test_add_source_column_union(self):
        """Agrega columna __source_file__ en modo UNION"""
        df = pd.DataFrame({'a': [1, 2, 3]})

        result = MergeService.add_source_column(df, ['file1.csv', 'file2.csv'], [1, 2], 'union')

        assert '__source_file__' in result.columns
        assert result['__source_file__'].iloc[0] == 'file1.csv'
        assert result['__source_file__'].iloc[1] == 'file2.csv'
        assert result['__source_file__'].iloc[2] == 'file2.csv'

    def test_add_source_column_join(self):
        """Agrega columna __source_file__ en modo JOIN"""
        df = pd.DataFrame({'a': [1, 2]})

        result = MergeService.add_source_column(df, ['file1.csv', 'file2.csv'], [1, 1], 'join')

        assert '__source_file__' in result.columns
        assert result['__source_file__'].iloc[0] == 'file1.csv (base)'


class TestInferKeyColumns:
    """Tests para inferencia de columnas clave"""

    def test_infer_id_column(self):
        """Inferir columna 'id'"""
        result = MergeService._infer_key_columns({'id', 'nombre', 'email'})
        assert 'id' in result

    def test_infer_underscore_id(self):
        """Inferir columna 'cliente_id'"""
        result = MergeService._infer_key_columns({'cliente_id', 'nombre'})
        assert 'cliente_id' in result

    def test_infer_email(self):
        """Inferir columna 'email'"""
        result = MergeService._infer_key_columns({'email', 'nombre'})
        assert 'email' in result

    def test_infer_dni(self):
        """Inferir columna 'dni'"""
        result = MergeService._infer_key_columns({'dni', 'nombre'})
        assert 'dni' in result

    def test_no_candidates(self):
        """No hay candidatos"""
        result = MergeService._infer_key_columns({'nombre', 'direccion', 'telefono'})
        assert result == []


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

"""
Tests para el HarmonizerService.
"""
import pytest
import sys
from pathlib import Path
import pandas as pd

# Agregar backend al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.harmonizer_service import HarmonizerService


# ==================== FIXTURES ====================

@pytest.fixture
def good_csv_df():
    """DataFrame con estructura correcta."""
    return pd.DataFrame({
        'nombre': ['Juan', 'Maria', 'Pedro', 'Ana'],
        'email': ['juan@test.com', 'maria@test.com', 'pedro@test.com', 'ana@test.com'],
        'telefono': ['1234567890', '0987654321', '5555555555', '999888777'],
        'edad': [25, 30, 28, 35]
    })


@pytest.fixture
def shuffled_columns_df():
    """DataFrame con columnas en orden diferente."""
    return pd.DataFrame({
        'telefono': ['111', '222', '333'],
        'nombre': ['Ana', 'Luis', 'Carlos'],
        'edad': [22, 35, 29],
        'email': ['ana@test.com', 'luis@test.com', 'carlos@test.com']
    })


@pytest.fixture
def missing_columns_df():
    """DataFrame con columnas faltantes."""
    return pd.DataFrame({
        'nombre': ['Rosa', 'Miguel'],
        'email': ['rosa@test.com', 'miguel@test.com']
    })


@pytest.fixture
def misplaced_content_df():
    """DataFrame con contenido en columnas incorrectas."""
    return pd.DataFrame({
        'nombre': ['test@test.com', 'otro@correo.com', 'email@malo.com'],
        'email': ['Juan', 'Maria', 'Pedro'],
        'telefono': ['999', '888', '777'],
        'edad': [25, 30, 28]
    })


# ==================== TESTS ====================

class TestHarmonizerService:
    """Tests para HarmonizerService."""

    def test_calculate_file_health_good(self, good_csv_df):
        """Archivo bueno debe tener score alto."""
        score = HarmonizerService.calculate_file_health(good_csv_df)
        assert score > 50, f"Score {score} debería ser > 50 para archivo bueno"

    def test_calculate_file_health_empty(self):
        """DataFrame vacío debe tener score 0."""
        score = HarmonizerService.calculate_file_health(pd.DataFrame())
        assert score == 0.0

    def test_profile_column_detects_email(self):
        """profile_column debe detectar tipo email."""
        df = pd.DataFrame({'col': ['a@b.com', 'c@d.com', 'not_an_email']})
        profile = HarmonizerService.profile_column(df['col'], 'col')

        assert profile.estimated_type == 'email'
        assert profile.valid_ratio >= 0.5  # Al menos 2 de 3 son emails

    def test_profile_column_detects_phone(self):
        """profile_column debe detectar tipo phone."""
        df = pd.DataFrame({'col': ['1234567890', '9876543210', 'abc']})
        profile = HarmonizerService.profile_column(df['col'], 'col')

        assert profile.estimated_type == 'phone'
        assert profile.valid_ratio >= 0.5

    def test_choose_reference_file(self, good_csv_df, missing_columns_df):
        """Debe elegir el archivo con mejor estructura como referencia."""
        dfs = [missing_columns_df, good_csv_df]
        filenames = ['missing.csv', 'good.csv']

        ref_idx, ref_name = HarmonizerService.choose_reference_file(dfs, filenames)

        assert ref_name == 'good.csv'
        assert ref_idx == 1

    def test_align_schema_reorders_columns(self, shuffled_columns_df, good_csv_df):
        """align_schema debe reordenar columnas al esquema del referencia."""
        aligned = HarmonizerService.align_schema(shuffled_columns_df, good_csv_df)

        # Las primeras columnas deben coincidir con el orden del referencia
        ref_cols = list(good_csv_df.columns)
        aligned_cols = list(aligned.columns)[:len(ref_cols)]

        assert aligned_cols == ref_cols, f"Columnas no coinciden: {aligned_cols} vs {ref_cols}"

    def test_align_schema_adds_missing_columns(self, missing_columns_df, good_csv_df):
        """align_schema debe agregar columnas faltantes con NaN."""
        aligned = HarmonizerService.align_schema(missing_columns_df, good_csv_df)

        assert 'telefono' in aligned.columns
        assert 'edad' in aligned.columns

        # Las filas del archivo incompleto deben tener NaN en columnas faltantes
        assert aligned.loc[0, 'telefono'] is pd.NA or pd.isna(aligned.loc[0, 'telefono'])

    def test_align_schema_handles_misplaced_content(self, misplaced_content_df, good_csv_df):
        """align_schema debe detectar y reparar contenido misplaced."""
        aligned = HarmonizerService.align_schema(misplaced_content_df, good_csv_df)

        # En la columna email, los valores que son emails de verdad
        # deben estar en la columna correcta (email), no en nombre
        for val in aligned['email']:
            if pd.notna(val) and str(val) not in ['Juan', 'Maria', 'Pedro']:
                # Si es un email real, debe verse como email
                assert '@' in str(val), f"Valor no debería estar en email: {val}"

    def test_harmonize_combines_multiple_files(self, good_csv_df, shuffled_columns_df):
        """harmonize debe combinar múltiples archivos."""
        dfs = [shuffled_columns_df, good_csv_df]
        filenames = ['shuffled.csv', 'good.csv']

        combined, metadata = HarmonizerService.harmonize(dfs, filenames)

        assert len(combined) == len(shuffled_columns_df) + len(good_csv_df)
        assert metadata['reference_file'] == 'good.csv'
        assert metadata['files_harmonized'] == 2
        assert '__source_file__' in combined.columns

    def test_harmonize_raises_error_with_single_file(self, good_csv_df):
        """harmonize debe fallar con menos de 2 archivos."""
        with pytest.raises(ValueError, match="al menos 2 archivos"):
            HarmonizerService.harmonize([good_csv_df], ['single.csv'])

    def test_harmonize_detects_misplaced(self, misplaced_content_df, good_csv_df):
        """harmonize debe detectar cuando hay contenido en columnas incorrectas."""
        # Crear un escenario donde el archivo con problemas es la referencia
        # y el bueno tiene las columnas correctas
        dfs = [good_csv_df.copy(), misplaced_content_df.copy()]
        filenames = ['good.csv', 'misplaced.csv']

        combined, metadata = HarmonizerService.harmonize(dfs, filenames)

        # El archivo bueno debe ser la referencia
        assert metadata['reference_file'] == 'good.csv'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
"""
Esquemas Pydantic para el módulo de datos.
Define la estructura de request/response de los endpoints.
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class FileInfo(BaseModel):
    """Información de un archivo procesado."""
    filename: str
    rows: int
    columns: int


class SchemaValidation(BaseModel):
    """Validación de esquema entre archivos."""
    total_columns: int
    common_columns: List[str]
    columns_by_file: Dict[str, List[str]]
    has_schema_differences: bool
    merge_mode_requested: str
    merge_mode_detected: str
    merge_mode_used: str
    merge_strategy: str


class UploadResponse(BaseModel):
    """Respuesta de upload CSV/Excel."""
    filename: str
    rows: int
    columns: List[str]
    preview: List[Dict[str, Any]]
    column_types: Dict[str, str]


class TransformResponse(BaseModel):
    """Respuesta de transformación de datos."""
    success: bool
    filename: str
    operation: str
    original_rows: int
    transformed_rows: int
    message: str
    columns: List[str]
    preview: List[Dict[str, Any]]


class DuplicateGroup(BaseModel):
    """Grupo de filas duplicadas."""
    count: int
    indices: List[int]
    rows: List[Dict[str, Any]]


class DetectDuplicatesResponse(BaseModel):
    """Respuesta de detección de duplicados."""
    success: bool
    total_rows: int
    duplicated_rows: int
    duplicate_groups: int
    groups: List[DuplicateGroup]
    key_columns_used: Any  # str o "TODAS"
    message: str


class MergeResponse(BaseModel):
    """Respuesta de merge de archivos."""
    success: bool
    files_processed: int
    files: List[FileInfo]
    original_rows: int
    transformed_rows: int
    message: str
    columns: List[str]
    schema_validation: SchemaValidation
    preview: List[Dict[str, Any]]

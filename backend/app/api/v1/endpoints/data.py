"""
Endpoints de procesamiento de datos.
Controller puramente de enrutamiento - toda la lógica está en DataService.
"""
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional, List

from app.services.data_service import DataService
from app.schemas.data_schemas import (
    UploadResponse,
    TransformResponse,
    DetectDuplicatesResponse,
    MergeResponse
)

router = APIRouter()


@router.post("/upload/csv", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    """Sube y procesa un archivo CSV."""
    return await DataService.upload_file(file, allowed_extensions=('.csv',))


@router.post("/upload/excel", response_model=UploadResponse)
async def upload_excel(file: UploadFile = File(...)):
    """Sube y procesa un archivo Excel."""
    return await DataService.upload_file(file, allowed_extensions=('.xlsx', '.xls'))


@router.post("/detect-duplicates", response_model=DetectDuplicatesResponse)
async def detect_duplicates(
    file: UploadFile = File(...),
    key_columns: Optional[str] = None,
    case_sensitive: bool = False,
    normalize_whitespace: bool = True,
    normalize_accents: bool = True
):
    """Detecta duplicados SIN eliminarlos. Devuelve grupos para revisión."""
    return await DataService.detect_duplicates(
        file, key_columns, case_sensitive, normalize_whitespace, normalize_accents
    )


@router.post("/transform", response_model=TransformResponse)
async def transform_data(
    file: UploadFile = File(...),
    operation: str = "dropna",
    fill_value: Optional[str] = None,
    key_columns: Optional[str] = None,
    case_sensitive: bool = False,
    normalize_whitespace: bool = True,
    normalize_accents: bool = True,
    keep: str = "first"
):
    """Operaciones de limpieza: dropna, fillna, drop_duplicates, clean."""
    return await DataService.transform(
        file, operation, fill_value, key_columns,
        case_sensitive, normalize_whitespace, normalize_accents, keep
    )


@router.post("/merge", response_model=MergeResponse)
async def merge_files(
    files: List[UploadFile] = File(...),
    operation: str = Form("clean"),
    fill_value: Optional[str] = Form(None),
    key_columns: Optional[str] = Form(None),
    case_sensitive: bool = Form(False),
    normalize_whitespace: bool = Form(True),
    normalize_accents: bool = Form(True),
    keep: str = Form("first"),
    merge_mode: str = Form("auto"),
    join_type: str = Form("inner")
):
    """
    Combina múltiples archivos CSV o Excel.
    Modos: auto (detecta), union (vertical), join (horizontal por key_columns).
    """
    return await DataService.merge(
        files, operation, fill_value, key_columns,
        case_sensitive, normalize_whitespace, normalize_accents, keep,
        merge_mode, join_type
    )

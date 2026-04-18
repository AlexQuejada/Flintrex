from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.uploaded_file import UploadedFile
import pandas as pd
import io
from typing import Optional, List
import json

router = APIRouter()

# ==================== UPLOAD CSV ====================
@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    # Definir variables primero
    filename = file.filename.lower()
    contents = await file.read()
    
    if not filename.endswith('.csv'):
        raise HTTPException(400, "El archivo debe ser CSV")
    
    # Probar diferentes codificaciones y separadores
    encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    separators = [',', ';', '\t', '|']
    df = None
    
    for enc in encodings:
        for sep in separators:
            try:
                content = contents
                # Detectar y remover BOM (marca de orden de bytes UTF-8)
                if content.startswith(b'\xef\xbb\xbf'):
                    content = content[3:]
                
                df = pd.read_csv(
                    io.BytesIO(content),
                    encoding=enc,
                    sep=sep,
                    engine='python',
                    on_bad_lines='skip'
                )
                if df is not None and len(df.columns) > 1:
                    break
            except Exception:
                continue
        if df is not None and len(df.columns) > 1:
            break
    
    if df is None:
        raise HTTPException(400, "No se pudo leer el CSV. Verifica el formato (separador o codificación).")
    
    # Vista previa
    preview = df.head(100).fillna("").to_dict(orient='records')
    
    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "preview": preview,
        "column_types": df.dtypes.astype(str).to_dict()
    }

# ==================== UPLOAD EXCEL ====================
@router.post("/upload/excel")
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(400, "El archivo debe ser Excel (.xlsx o .xls)")
    
    try:
        contents = await file.read()
        
        # Leer Excel 
        df = pd.read_excel(io.BytesIO(contents))
        
        preview = df.head(100).fillna("").to_dict(orient='records')
        
        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "preview": preview,
            "column_types": df.dtypes.astype(str).to_dict()
        }
    
    except Exception as e:
        raise HTTPException(400, f"Error al leer el Excel: {str(e)}")


# ==================== DETECTAR DUPLICADOS (SIN ELIMINAR) ====================
@router.post("/detect-duplicates")
async def detect_duplicates(
    file: UploadFile = File(...),
    key_columns: Optional[str] = None,
    case_sensitive: bool = False,
    normalize_whitespace: bool = True,
    normalize_accents: bool = True
):
    """
    Detecta duplicados SIN eliminarlos. Devuelve grupos de duplicados para revisión.

    - key_columns: Columnas que identifican un registro único (ej: "email" o "nombre,telefono")
    - Si no se especifican, usa todas las columnas (comportamiento original)
    """
    contents = await file.read()
    filename = file.filename.lower()

    df = await _read_file(contents, filename)
    if df is None:
        raise HTTPException(400, "No se pudo leer el archivo")

    # Normalizar
    df_clean = _normalize_df(df.copy(), case_sensitive, normalize_whitespace, normalize_accents)

    # Determinar columnas clave
    subset_cols = None
    if key_columns:
        subset_cols = [c.strip() for c in key_columns.split(',') if c.strip() in df_clean.columns]

    # Detectar duplicados
    if subset_cols:
        duplicated_mask = df_clean.duplicated(subset=subset_cols, keep=False)
    else:
        duplicated_mask = df_clean.duplicated(keep=False)

    duplicated_rows = df[duplicated_mask]  # Devolver datos ORIGINALES, no normalizados

    # Agrupar por grupo de duplicados
    groups = []
    if len(duplicated_rows) > 0:
        if subset_cols:
            grouped = duplicated_rows.groupby([df_clean.loc[duplicated_rows.index, col] for col in subset_cols])
        else:
            grouped = [('', duplicated_rows)]  # Un solo grupo si no hay subset

        for _, group in grouped if subset_cols else grouped:
            groups.append({
                "count": len(group),
                "indices": group.index.tolist(),
                "rows": group.fillna("").astype(str).to_dict(orient='records')
            })

    return {
        "success": True,
        "total_rows": len(df),
        "duplicated_rows": int(duplicated_mask.sum()),
        "duplicate_groups": len(groups),
        "groups": groups[:50],  # Limitar a 50 grupos para no saturar
        "key_columns_used": subset_cols or "TODAS",
        "message": f"Se encontraron {len(groups)} grupos de duplicados"
    }


# ==================== TRANSFORM ROBUSTA ====================
@router.post("/transform")
async def transform_data(
    file: UploadFile = File(...),
    operation: str = "dropna",
    fill_value: Optional[str] = None,
    subset: Optional[str] = None,
    key_columns: Optional[str] = None,
    case_sensitive: bool = False,
    normalize_whitespace: bool = True,
    normalize_accents: bool = True,
    keep: str = "first"
):
    """
    Operaciones de limpieza robustas:

    - dropna: Elimina filas con valores nulos
    - fillna: Rellena nulos con fill_value
    - drop_duplicates: Elimina duplicados (USA key_columns, no subset)
    - clean: Solo limpia y normaliza sin eliminar

    key_columns: Columnas que identifican unicidad (ej: "cliente_id" o "email,telefono")
    keep: "first" (conserva primera), "last" (conserva última), "False" (elimina todas las duplicadas)
    """
    contents = await file.read()
    filename = file.filename.lower()

    df = await _read_file(contents, filename)
    if df is None:
        raise HTTPException(400, "No se pudo leer el archivo")

    original_rows = len(df)

    # ============ LIMPIEZA Y NORMALIZACIÓN ============
    df = _normalize_df(df, case_sensitive, normalize_whitespace, normalize_accents)

    # ============ OPERACIONES ============
    if operation == "dropna":
        df = df.dropna()
        message = f"Eliminadas {original_rows - len(df)} filas con valores nulos"

    elif operation == "fillna":
        if fill_value is None:
            raise HTTPException(400, "fillna requiere fill_value")
        df = df.fillna(fill_value)
        message = f"Rellenados valores nulos con '{fill_value}'"

    elif operation == "drop_duplicates":
        # USAR key_columns en lugar de subset para claridad
        subset_cols = None
        if key_columns:
            subset_cols = [c.strip() for c in key_columns.split(',') if c.strip() in df.columns]
        elif subset:  # Backward compatibility
            subset_cols = [c.strip() for c in subset.split(',') if c.strip() in df.columns]

        # Validar que existen las columnas
        if key_columns and not subset_cols:
            raise HTTPException(400, f"Columnas clave no encontradas: {key_columns}")

        rows_before = len(df)

        # Convertir keep a boolean
        keep_val = keep if keep in ["first", "last"] else False

        df = df.drop_duplicates(subset=subset_cols, keep=keep_val)

        deleted = rows_before - len(df)
        message = f"Eliminadas {deleted} filas duplicadas"
        if subset_cols:
            message += f" (basado en: {', '.join(subset_cols)})"
        else:
            message += " (comparando todas las columnas)"

    elif operation == "clean":
        message = "Limpieza aplicada (normalización de texto y espacios)"

    else:
        raise HTTPException(400, f"Operación '{operation}' no soportada. Usa: dropna, fillna, drop_duplicates, clean")

    return {
        "success": True,
        "filename": file.filename,
        "operation": operation,
        "original_rows": original_rows,
        "transformed_rows": len(df),
        "message": message,
        "columns": list(df.columns),
        "preview": df.head(100).fillna("").astype(str).to_dict(orient='records')
    }


# ==================== FUNCIONES AUXILIARES ====================
async def _read_file(contents: bytes, filename: str) -> pd.DataFrame:
    """Lee CSV o Excel de forma robusta"""
    df = None
    
    # convertir a minúsculas para case insensitive
    filename_lower = filename.lower()

    if filename_lower.endswith('.csv'):
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        separators = [',', ';', '\t', '|']
        for enc in encodings:
            for sep in separators:
                try:
                    content = contents
                    if content.startswith(b'\xef\xbb\xbf'):
                        content = content[3:]
                    df = pd.read_csv(
                        io.BytesIO(content),
                        encoding=enc,
                        sep=sep,
                        engine='python',
                        on_bad_lines='skip'
                    )
                    if df is not None and len(df.columns) > 0:
                        break
                except Exception:
                    continue
            if df is not None and len(df.columns) > 0:
                break

    elif filename_lower.endswith(('.xlsx', '.xls')):
        try:
            df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
        except Exception:
            df = pd.read_excel(io.BytesIO(contents))

    return df


def _normalize_df(df: pd.DataFrame, case_sensitive: bool, normalize_whitespace: bool, normalize_accents: bool) -> pd.DataFrame:
    """Normaliza el DataFrame: acentos, espacios, mayúsculas"""
    for col in df.select_dtypes(include=['object']).columns:
        # Convertir a string
        df[col] = df[col].astype(str)

        # Normalizar espacios (quitar extras al inicio/fin y múltiples espacios)
        if normalize_whitespace:
            df[col] = df[col].str.strip().str.replace(r'\s+', ' ', regex=True)

        # Quitar acentos
        if normalize_accents:
            df[col] = df[col].str.normalize('NFKD').str.encode('ascii', errors='ignore').str.decode('utf-8')

        # Minúsculas
        if not case_sensitive:
            df[col] = df[col].str.lower()

    return df
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useData, ProcessedData } from '../../../context/DataContext';
import { PreviewData, RowContextMenuState, ColumnContextMenuState, EditingCell } from '../types';

export const useFileMerge = () => {
  const { processedData, setProcessedData, clearProcessedData } = useData();
  const [files, setFiles] = useState<FileList | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Opciones de operación
  const [operation, setOperation] = useState('clean');
  const [keyColumns, setKeyColumns] = useState('');
  const [fillValue, setFillValue] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [normalizeAccents, setNormalizeAccents] = useState(true);
  const [normalizeWhitespace, setNormalizeWhitespace] = useState(true);
  const [keep, setKeep] = useState('first');
  const [downloadFormat, setDownloadFormat] = useState('csv');

  // Estados de edición
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState<RowContextMenuState>({
    visible: false, x: 0, y: 0, rowIdx: null
  });
  const [columnContextMenu, setColumnContextMenu] = useState<ColumnContextMenuState>({
    visible: false, x: 0, y: 0, colIdx: null, colName: null
  });
  const [editingRowName, setEditingRowName] = useState<number | null>(null);
  const [rowNameValue, setRowNameValue] = useState('');
  const [editingColumnName, setEditingColumnName] = useState<number | null>(null);
  const [columnNameValue, setColumnNameValue] = useState('');

  // Cargar datos persistidos
  useEffect(() => {
    if (processedData?.source === 'merge') {
      const previewWithNames = processedData.preview.map((row: any, idx: number) => ({
        ...row,
        _row_name: row._row_name || `Fila_${idx + 1}`
      }));
      setPreview({
        files_processed: processedData.filename.split(',').length,
        original_rows: processedData.original_rows,
        transformed_rows: processedData.transformed_rows,
        columns: processedData.columns.includes('_row_name')
          ? processedData.columns
          : ['_row_name', ...processedData.columns.filter((c: string) => c !== '_row_name')],
        preview: previewWithNames,
        message: 'Datos cargados desde sesión anterior',
      });
    }
  }, [processedData]);

  // Cerrar menús al hacer clic fuera o scrollear
  useEffect(() => {
    const handleCloseMenus = () => {
      hideContextMenu();
      hideColumnContextMenu();
    };
    if (contextMenu.visible || columnContextMenu.visible) {
      document.addEventListener('click', handleCloseMenus);
      window.addEventListener('scroll', handleCloseMenus, true);
      return () => {
        document.removeEventListener('click', handleCloseMenus);
        window.removeEventListener('scroll', handleCloseMenus, true);
      };
    }
  }, [contextMenu.visible, columnContextMenu.visible]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFiles(e.target.files);
    }
  }, []);

  const handleMerge = useCallback(async () => {
    if (!files || files.length < 2) {
      alert('Selecciona al menos 2 archivos para combinar');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    formData.append('operation', operation);
    if (fillValue) formData.append('fill_value', fillValue);
    if (keyColumns) formData.append('key_columns', keyColumns);
    formData.append('case_sensitive', String(caseSensitive));
    formData.append('normalize_accents', String(normalizeAccents));
    formData.append('normalize_whitespace', String(normalizeWhitespace));
    formData.append('keep', keep);
    formData.append('merge_mode', 'union');

    try {
      const res = await axios.post('http://localhost:8000/api/v1/data/merge', formData);
      const previewWithNames = res.data.preview.map((row: any, idx: number) => ({
        ...row,
        _row_name: `Fila_${idx + 1}`
      }));
      const columnsWithRowName = ['_row_name', ...res.data.columns.filter((c: string) => c !== '_row_name')];

      setPreview({
        ...res.data,
        preview: previewWithNames,
        columns: columnsWithRowName
      });

      setProcessedData({
        filename: res.data.files.map((f: any) => f.filename).join(', '),
        columns: columnsWithRowName,
        preview: previewWithNames,
        transformed_rows: res.data.transformed_rows,
        original_rows: res.data.original_rows,
        columnTypes: Object.fromEntries(columnsWithRowName.map((col: string) => [col, 'unknown'])),
        source: 'merge',
      });
    } catch (err) {
      console.error('Error al combinar:', err);
      alert('Error al combinar los archivos');
    } finally {
      setLoading(false);
    }
  }, [files, operation, fillValue, keyColumns, caseSensitive, normalizeAccents, normalizeWhitespace, keep, setProcessedData]);

  const handleDownload = useCallback(async () => {
    if (!files || files.length < 2) {
      alert('Selecciona al menos 2 archivos');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    formData.append('operation', operation);
    if (fillValue) formData.append('fill_value', fillValue);
    if (keyColumns) formData.append('key_columns', keyColumns);
    formData.append('case_sensitive', String(caseSensitive));
    formData.append('normalize_accents', String(normalizeAccents));
    formData.append('normalize_whitespace', String(normalizeWhitespace));
    formData.append('keep', keep);
    formData.append('merge_mode', 'union');
    formData.append('download_format', downloadFormat);

    try {
      const res = await axios.post('http://localhost:8000/api/v1/data/merge/download', formData, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = res.headers['content-disposition'];
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || `merged.${downloadFormat === 'excel' ? 'xlsx' : 'csv'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar:', err);
      alert('Error al descargar el archivo');
    } finally {
      setLoading(false);
    }
  }, [files, operation, fillValue, keyColumns, caseSensitive, normalizeAccents, normalizeWhitespace, keep, downloadFormat]);

  // Edición de celdas
  const startEditing = useCallback((rowIdx: number, col: string, value: any) => {
    setEditingCell({ row: rowIdx, col });
    setEditValue(value?.toString() || '');
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingCell || !preview) return;
    const newPreview = [...preview.preview];
    newPreview[editingCell.row] = {
      ...newPreview[editingCell.row],
      [editingCell.col]: editValue
    };
    setPreview({ ...preview, preview: newPreview });
    setHasChanges(true);
    setEditingCell(null);
  }, [editingCell, editValue, preview]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Menús contextuales
  const showContextMenu = useCallback((e: React.MouseEvent, rowIdx: number) => {
    e.preventDefault();
    hideColumnContextMenu();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, rowIdx });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false, rowIdx: null }));
  }, []);

  const showColumnContextMenu = useCallback((e: React.MouseEvent, colIdx: number, colName: string) => {
    e.preventDefault();
    e.stopPropagation();
    hideContextMenu();
    setColumnContextMenu({ visible: true, x: e.clientX, y: e.clientY, colIdx, colName });
  }, []);

  const hideColumnContextMenu = useCallback(() => {
    setColumnContextMenu(prev => ({ ...prev, visible: false, colIdx: null, colName: null }));
  }, []);

  // Operaciones de filas
  const addRow = useCallback((position: 'above' | 'below') => {
    if (!preview || contextMenu.rowIdx === null) return;
    const newRow: any = {};
    preview.columns.forEach((col: string) => {
      if (col !== '_row_name') newRow[col] = '';
    });
    newRow._row_name = `Fila_${preview.preview.length + 1}`;

    const insertIdx = position === 'above' ? contextMenu.rowIdx : contextMenu.rowIdx! + 1;
    const newPreview = [...preview.preview];
    newPreview.splice(insertIdx, 0, newRow);

    setPreview({ ...preview, preview: newPreview, transformed_rows: newPreview.length });
    setHasChanges(true);
    hideContextMenu();
  }, [preview, contextMenu.rowIdx]);

  const deleteRow = useCallback(() => {
    if (!preview || contextMenu.rowIdx === null) return;
    const newPreview = preview.preview.filter((_: any, idx: number) => idx !== contextMenu.rowIdx);
    setPreview({ ...preview, preview: newPreview, transformed_rows: newPreview.length });
    setHasChanges(true);
    hideContextMenu();
  }, [preview, contextMenu.rowIdx]);

  const startEditingRowName = useCallback((rowIdx: number) => {
    setEditingRowName(rowIdx);
    setRowNameValue(preview?.preview[rowIdx]._row_name || `Fila_${rowIdx + 1}`);
    hideContextMenu();
  }, [preview]);

  const saveRowName = useCallback(() => {
    if (!preview || editingRowName === null) return;
    const newPreview = [...preview.preview];
    newPreview[editingRowName] = {
      ...newPreview[editingRowName],
      _row_name: rowNameValue.trim() || `Fila_${editingRowName + 1}`
    };
    setPreview({ ...preview, preview: newPreview });
    setHasChanges(true);
    setEditingRowName(null);
    setRowNameValue('');
  }, [preview, editingRowName, rowNameValue]);

  const cancelRowNameEdit = useCallback(() => {
    setEditingRowName(null);
    setRowNameValue('');
  }, []);

  // Operaciones de columnas
  const addColumn = useCallback((position: 'left' | 'right') => {
    if (!preview || columnContextMenu.colIdx === null) return;
    const newColName = `Columna_${preview.columns.filter((c: string) => c.startsWith('Columna_')).length + 1}`;
    const insertIdx = position === 'left' ? columnContextMenu.colIdx : columnContextMenu.colIdx! + 1;

    const newColumns = [...preview.columns];
    newColumns.splice(insertIdx, 0, newColName);
    const newPreview = preview.preview.map((row: any) => ({ ...row, [newColName]: '' }));

    setPreview({ ...preview, columns: newColumns, preview: newPreview });
    setHasChanges(true);
    hideColumnContextMenu();
  }, [preview, columnContextMenu.colIdx]);

  const deleteColumn = useCallback(() => {
    if (!preview || columnContextMenu.colIdx === null) return;
    const colToDelete = preview.columns[columnContextMenu.colIdx];
    if (colToDelete === '_row_name') {
      alert('No se puede eliminar la columna de nombre de fila');
      hideColumnContextMenu();
      return;
    }

    const newColumns = preview.columns.filter((_: string, idx: number) => idx !== columnContextMenu.colIdx);
    const newPreview = preview.preview.map((row: any) => {
      const newRow = { ...row };
      delete newRow[colToDelete];
      return newRow;
    });

    setPreview({ ...preview, columns: newColumns, preview: newPreview });
    setHasChanges(true);
    hideColumnContextMenu();
  }, [preview, columnContextMenu.colIdx]);

  const startEditingColumnName = useCallback((colIdx: number) => {
    setEditingColumnName(colIdx);
    setColumnNameValue(preview?.columns[colIdx] || '');
    hideColumnContextMenu();
  }, [preview]);

  const saveColumnName = useCallback(() => {
    if (!preview || editingColumnName === null) return;
    const oldName = preview.columns[editingColumnName];
    const newName = columnNameValue.trim();

    if (!newName) {
      alert('El nombre de la columna no puede estar vacío');
      return;
    }
    if (newName === oldName) {
      setEditingColumnName(null);
      setColumnNameValue('');
      return;
    }
    if (preview.columns.some((c: string, idx: number) => c === newName && idx !== editingColumnName)) {
      alert(`Ya existe una columna llamada "${newName}"`);
      return;
    }

    const newColumns = [...preview.columns];
    newColumns[editingColumnName] = newName;
    const newPreview = preview.preview.map((row: any) => {
      const newRow = { ...row };
      newRow[newName] = newRow[oldName];
      delete newRow[oldName];
      return newRow;
    });

    setPreview({ ...preview, columns: newColumns, preview: newPreview });
    setHasChanges(true);
    setEditingColumnName(null);
    setColumnNameValue('');
  }, [preview, editingColumnName, columnNameValue]);

  const cancelColumnNameEdit = useCallback(() => {
    setEditingColumnName(null);
    setColumnNameValue('');
  }, []);

  const saveChangesToContext = useCallback(() => {
    if (!preview || !hasChanges) return;
    const previewWithNames = preview.preview.map((row: any, idx: number) => ({
      ...row,
      _row_name: row._row_name || `Fila_${idx + 1}`
    }));

    setProcessedData({
      filename: preview.files?.map((f: any) => f.filename).join(', ') || preview.filename || '',
      columns: preview.columns.includes('_row_name')
        ? preview.columns
        : ['_row_name', ...preview.columns.filter((c: string) => c !== '_row_name')],
      preview: previewWithNames,
      transformed_rows: previewWithNames.length,
      original_rows: preview.original_rows,
      columnTypes: processedData?.columnTypes || {},
      source: 'merge',
    });
    setHasChanges(false);
  }, [preview, hasChanges, processedData, setProcessedData]);

  const clearData = useCallback(() => {
    clearProcessedData();
    setPreview(null);
    setFiles(null);
    setHasChanges(false);
  }, [clearProcessedData]);

  return {
    // State
    files,
    preview,
    loading,
    hasChanges,
    operation,
    keyColumns,
    fillValue,
    caseSensitive,
    normalizeAccents,
    normalizeWhitespace,
    keep,
    downloadFormat,
    editingCell,
    editValue,
    contextMenu,
    columnContextMenu,
    editingRowName,
    rowNameValue,
    editingColumnName,
    columnNameValue,

    // Setters
    setOperation,
    setKeyColumns,
    setFillValue,
    setCaseSensitive,
    setNormalizeAccents,
    setNormalizeWhitespace,
    setKeep,
    setDownloadFormat,
    setEditValue,
    setColumnNameValue,

    // Actions
    handleFileChange,
    handleMerge,
    handleDownload,
    startEditing,
    saveEdit,
    cancelEdit,
    showContextMenu,
    showColumnContextMenu,
    addRow,
    deleteRow,
    startEditingRowName,
    saveRowName,
    cancelRowNameEdit,
    addColumn,
    deleteColumn,
    startEditingColumnName,
    saveColumnName,
    cancelColumnNameEdit,
    saveChangesToContext,
    clearData,
  };
};

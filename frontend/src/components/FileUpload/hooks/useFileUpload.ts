import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useData, ProcessedData } from '../../../context/DataContext';
import { PreviewData, RowContextMenuState, ColumnContextMenuState, EditingCell } from '../types';

export const useFileUpload = () => {
  const { processedData, setProcessedData, clearProcessedData } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [localPreview, setLocalPreview] = useState<PreviewData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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
  const [uploadError, setUploadError] = useState<boolean>(false);

  // Cargar datos persistidos al montar
  useEffect(() => {
    if (processedData?.source === 'single') {
      const previewWithNames = processedData.preview.map((row: any, idx: number) => ({
        ...row,
        _row_name: row._row_name || `Fila_${idx + 1}`
      }));
      setLocalPreview({
        filename: processedData.filename,
        columns: processedData.columns.includes('_row_name')
          ? processedData.columns
          : ['_row_name', ...processedData.columns.filter((c: string) => c !== '_row_name')],
        preview: previewWithNames,
        rows: processedData.transformed_rows || processedData.original_rows,
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
    setUploadError(false);
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setHasChanges(false);
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = file.name.endsWith('.csv')
      ? 'http://localhost:8000/api/v1/data/upload/csv'
      : file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      ? 'http://localhost:8000/api/v1/data/upload/excel'
      : null;

    if (!endpoint) {
      alert('Formato no soportado. Use CSV o Excel');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(endpoint, formData);
      const previewWithNames = res.data.preview.map((row: any, idx: number) => ({
        ...row,
        _row_name: `Fila_${idx + 1}`
      }));
      const columnsWithRowName = ['_row_name', ...res.data.columns.filter((c: string) => c !== '_row_name')];

      setLocalPreview({
        ...res.data,
        columns: columnsWithRowName,
        preview: previewWithNames,
      });

      setProcessedData({
        filename: res.data.filename,
        columns: columnsWithRowName,
        preview: previewWithNames,
        transformed_rows: res.data.rows,
        original_rows: res.data.rows,
        columnTypes: res.data.column_types,
        source: 'single',
      });
    } catch (err) {
      console.error(err);
      setUploadError(true);
    } finally {
      setLoading(false);
    }
  }, [file, setProcessedData]);

  // Edición de celdas
  const startEditing = useCallback((rowIdx: number, col: string, value: any) => {
    setEditingCell({ row: rowIdx, col });
    setEditValue(value?.toString() || '');
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingCell || !localPreview) return;
    const newPreview = [...localPreview.preview];
    newPreview[editingCell.row] = {
      ...newPreview[editingCell.row],
      [editingCell.col]: editValue
    };
    setLocalPreview({ ...localPreview, preview: newPreview });
    setHasChanges(true);
    setEditingCell(null);
  }, [editingCell, editValue, localPreview]);

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
    if (!localPreview || contextMenu.rowIdx === null) return;
    const newRow: any = {};
    localPreview.columns.forEach((col: string) => {
      if (col !== '_row_name') newRow[col] = '';
    });
    newRow._row_name = `Fila_${localPreview.preview.length + 1}`;

    const insertIdx = position === 'above' ? contextMenu.rowIdx : contextMenu.rowIdx! + 1;
    const newPreview = [...localPreview.preview];
    newPreview.splice(insertIdx, 0, newRow);

    setLocalPreview({ ...localPreview, preview: newPreview, rows: newPreview.length });
    setHasChanges(true);
    hideContextMenu();
  }, [localPreview, contextMenu.rowIdx]);

  const deleteRow = useCallback(() => {
    if (!localPreview || contextMenu.rowIdx === null) return;
    const newPreview = localPreview.preview.filter((_: any, idx: number) => idx !== contextMenu.rowIdx);
    setLocalPreview({ ...localPreview, preview: newPreview, rows: newPreview.length });
    setHasChanges(true);
    hideContextMenu();
  }, [localPreview, contextMenu.rowIdx]);

  const startEditingRowName = useCallback((rowIdx: number) => {
    setEditingRowName(rowIdx);
    setRowNameValue(localPreview?.preview[rowIdx]._row_name || `Fila_${rowIdx + 1}`);
    hideContextMenu();
  }, [localPreview]);

  const saveRowName = useCallback(() => {
    if (!localPreview || editingRowName === null) return;
    const newPreview = [...localPreview.preview];
    newPreview[editingRowName] = {
      ...newPreview[editingRowName],
      _row_name: rowNameValue.trim() || `Fila_${editingRowName + 1}`
    };
    setLocalPreview({ ...localPreview, preview: newPreview });
    setHasChanges(true);
    setEditingRowName(null);
    setRowNameValue('');
  }, [localPreview, editingRowName, rowNameValue]);

  const cancelRowNameEdit = useCallback(() => {
    setEditingRowName(null);
    setRowNameValue('');
  }, []);

  // Operaciones de columnas
  const addColumn = useCallback((position: 'left' | 'right') => {
    if (!localPreview || columnContextMenu.colIdx === null) return;
    const newColName = `Columna_${localPreview.columns.filter((c: string) => c.startsWith('Columna_')).length + 1}`;
    const insertIdx = position === 'left' ? columnContextMenu.colIdx : columnContextMenu.colIdx! + 1;

    const newColumns = [...localPreview.columns];
    newColumns.splice(insertIdx, 0, newColName);
    const newPreview = localPreview.preview.map((row: any) => ({ ...row, [newColName]: '' }));

    setLocalPreview({ ...localPreview, columns: newColumns, preview: newPreview });
    setHasChanges(true);
    hideColumnContextMenu();
  }, [localPreview, columnContextMenu.colIdx]);

  const deleteColumn = useCallback(() => {
    if (!localPreview || columnContextMenu.colIdx === null) return;
    const colToDelete = localPreview.columns[columnContextMenu.colIdx];
    if (colToDelete === '_row_name') {
      alert('No se puede eliminar la columna de nombre de fila');
      hideColumnContextMenu();
      return;
    }

    const newColumns = localPreview.columns.filter((_: string, idx: number) => idx !== columnContextMenu.colIdx);
    const newPreview = localPreview.preview.map((row: any) => {
      const newRow = { ...row };
      delete newRow[colToDelete];
      return newRow;
    });

    setLocalPreview({ ...localPreview, columns: newColumns, preview: newPreview });
    setHasChanges(true);
    hideColumnContextMenu();
  }, [localPreview, columnContextMenu.colIdx]);

  const startEditingColumnName = useCallback((colIdx: number) => {
    setEditingColumnName(colIdx);
    setColumnNameValue(localPreview?.columns[colIdx] || '');
    hideColumnContextMenu();
  }, [localPreview]);

  const saveColumnName = useCallback(() => {
    if (!localPreview || editingColumnName === null) return;
    const oldName = localPreview.columns[editingColumnName];
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
    if (localPreview.columns.some((c: string, idx: number) => c === newName && idx !== editingColumnName)) {
      alert(`Ya existe una columna llamada "${newName}"`);
      return;
    }

    const newColumns = [...localPreview.columns];
    newColumns[editingColumnName] = newName;
    const newPreview = localPreview.preview.map((row: any) => {
      const newRow = { ...row };
      newRow[newName] = newRow[oldName];
      delete newRow[oldName];
      return newRow;
    });

    setLocalPreview({ ...localPreview, columns: newColumns, preview: newPreview });
    setHasChanges(true);
    setEditingColumnName(null);
    setColumnNameValue('');
  }, [localPreview, editingColumnName, columnNameValue]);

  const cancelColumnNameEdit = useCallback(() => {
    setEditingColumnName(null);
    setColumnNameValue('');
  }, []);

  const saveChangesToContext = useCallback(() => {
    if (!localPreview || !hasChanges) return;
    const previewWithNames = localPreview.preview.map((row: any, idx: number) => ({
      ...row,
      _row_name: row._row_name || `Fila_${idx + 1}`
    }));

    setProcessedData({
      filename: localPreview.filename,
      columns: localPreview.columns.includes('_row_name')
        ? localPreview.columns
        : ['_row_name', ...localPreview.columns.filter((c: string) => c !== '_row_name')],
      preview: previewWithNames,
      transformed_rows: previewWithNames.length,
      original_rows: previewWithNames.length,
      columnTypes: processedData?.columnTypes || {},
      source: 'single',
    });
    setHasChanges(false);
  }, [localPreview, hasChanges, processedData, setProcessedData]);

  const clearData = useCallback(() => {
    clearProcessedData();
    setLocalPreview(null);
    setFile(null);
    setHasChanges(false);
  }, [clearProcessedData]);

  return {
    // State
    file,
    loading,
    localPreview,
    hasChanges,
    editingCell,
    editValue,
    contextMenu,
    columnContextMenu,
    editingRowName,
    rowNameValue,
    editingColumnName,
    columnNameValue,
    uploadError,
    setUploadError,

    // Actions
    setEditValue,
    setColumnNameValue,
    handleFileChange,
    handleUpload,
    startEditing,
    saveEdit,
    cancelEdit,
    showContextMenu,
    hideContextMenu,
    showColumnContextMenu,
    hideColumnContextMenu,
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

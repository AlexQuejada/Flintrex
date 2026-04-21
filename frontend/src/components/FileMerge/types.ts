export interface PreviewData {
  files_processed: number;
  original_rows: number;
  transformed_rows: number;
  columns: string[];
  preview: any[];
  message: string;
  files?: { filename: string }[];
  filename?: string;
}

export interface RowContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  rowIdx: number | null;
}

export interface ColumnContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  colIdx: number | null;
  colName: string | null;
}

export interface EditingCell {
  row: number;
  col: string;
}

export interface MergeFormData {
  files: FileList;
  operation: string;
  fillValue: string;
  keyColumns: string;
  caseSensitive: boolean;
  normalizeAccents: boolean;
  normalizeWhitespace: boolean;
  keep: string;
  downloadFormat: string;
}

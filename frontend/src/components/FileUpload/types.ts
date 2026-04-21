export interface PreviewData {
  filename: string;
  columns: string[];
  preview: any[];
  rows: number;
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

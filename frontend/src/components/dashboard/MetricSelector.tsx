import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProcessedData } from '../../context/DataContext';
import { Hash, FileText, Calendar, CheckSquare, HelpCircle } from 'lucide-react';

interface MetricSelectorProps {
  data: ProcessedData;
  onConfigChange: (config: ChartConfig | null, error: string) => void;
}

export interface ChartConfig {
  column: string;
  metric: string;
  chartType: string;
  groupBy: string;
  title: string;
}

// Detectar tipo de dato basado en valores de muestra
const detectColumnType = (columnName: string, preview: any[]): string => {
  if (!preview || preview.length === 0) return 'unknown';

  const values = preview.map(row => row[columnName]).filter(v => v !== null && v !== undefined && v !== '');
  if (values.length === 0) return 'unknown';

  // Verificar si es booleano
  const boolValues = values.filter(v => typeof v === 'boolean' || v === 'true' || v === 'false' || v === true || v === false);
  if (boolValues.length / values.length > 0.8) return 'boolean';

  // Verificar si es numérico
  const numValues = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v));
  if (numValues.length / values.length > 0.8) return 'numeric';

  // Verificar si es fecha
  const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/;
  const dateValues = values.filter(v => datePattern.test(String(v)));
  if (dateValues.length / values.length > 0.5) return 'datetime';

  return 'text';
};

const METRICS_BY_TYPE: Record<string, string[]> = {
  numeric: ['sum', 'avg', 'min', 'max', 'count', 'median', 'std_dev'],
  text: ['count', 'unique_count', 'mode', 'avg_length'],
  datetime: ['count', 'min', 'max', 'range_days', 'count_by_month', 'count_by_year'],
  boolean: ['count', 'count_true', 'count_false', 'percentage_true'],
  unknown: ['count']
};

const CHARTS_BY_TYPE: Record<string, string[]> = {
  numeric: ['bar', 'line', 'pie', 'scatter', 'histogram', 'table'],
  text: ['bar', 'pie', 'table'],
  datetime: ['line', 'bar', 'table'],
  boolean: ['pie', 'bar', 'table'],
  unknown: ['table']
};

const MetricSelector: React.FC<MetricSelectorProps> = ({ data, onConfigChange }) => {
  const { t } = useTranslation();
  // Configuración seleccionada
  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedChart, setSelectedChart] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [title, setTitle] = useState('');

  // Detectar tipos de columnas - memoizado
  const columnsInfo = useMemo(() => {
    return data.columns.map(col => {
      const type = detectColumnType(col, data.preview);
      return {
        name: col,
        type,
        availableMetrics: METRICS_BY_TYPE[type] || ['count'],
        availableCharts: CHARTS_BY_TYPE[type] || ['table']
      };
    });
  }, [data.columns, data.preview]);

  // Obtener info de columna seleccionada
  const selectedColumnInfo = useMemo(() =>
    columnsInfo.find(c => c.name === selectedColumn),
    [columnsInfo, selectedColumn]
  );

  // Resetear cuando cambia la columna
  const handleColumnChange = (colName: string) => {
    setSelectedColumn(colName);
    setSelectedMetric('');
    setSelectedChart('');
    setGroupBy('');
    setTitle('');
    onConfigChange(null, '');
  };

  // Validar y notificar cuando todo esté seleccionado
  const validateAndNotify = () => {
    if (!selectedColumn || !selectedMetric || !selectedChart) {
      onConfigChange(null, '');
      return;
    }

    if (selectedColumnInfo) {
      if (!selectedColumnInfo.availableMetrics.includes(selectedMetric)) {
        const errorMsg = `La métrica '${selectedMetric}' no es válida para columnas de tipo '${selectedColumnInfo.type}'. ` +
          `Métricas disponibles: ${selectedColumnInfo.availableMetrics.join(', ')}`;
        onConfigChange(null, errorMsg);
        return;
      }

      if (!selectedColumnInfo.availableCharts.includes(selectedChart)) {
        const errorMsg = `El gráfico '${selectedChart}' no es compatible con columnas de tipo '${selectedColumnInfo.type}'. ` +
          `Gráficos disponibles: ${selectedColumnInfo.availableCharts.join(', ')}`;
        onConfigChange(null, errorMsg);
        return;
      }
    }

    onConfigChange({
      column: selectedColumn,
      metric: selectedMetric,
      chartType: selectedChart,
      groupBy: groupBy,
      title: title || `${getMetricLabel(selectedMetric)} de ${selectedColumn}`
    }, '');
  };

  // Handlers que validan después de actualizar estado
  const handleMetricChange = (metric: string) => {
    setSelectedMetric(metric);
    // Validar inmediatamente con el nuevo valor
    if (selectedColumn && selectedChart) {
      setTimeout(validateAndNotify, 0);
    }
  };

  const handleChartChange = (chart: string) => {
    setSelectedChart(chart);
    if (selectedColumn && selectedMetric) {
      setTimeout(validateAndNotify, 0);
    }
  };

  const handleGroupByChange = (group: string) => {
    setGroupBy(group);
    if (selectedColumn && selectedMetric && selectedChart) {
      setTimeout(validateAndNotify, 0);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (selectedColumn && selectedMetric && selectedChart) {
      setTimeout(() => {
        onConfigChange({
          column: selectedColumn,
          metric: selectedMetric,
          chartType: selectedChart,
          groupBy: groupBy,
          title: newTitle || `${getMetricLabel(selectedMetric)} de ${selectedColumn}`
        }, '');
      }, 0);
    }
  };

  const getMetricLabel = (metric: string): string => {
    return t(`metricSelector.metrics.${metric}`, { defaultValue: metric });
  };

  const getChartLabel = (chart: string): string => {
    return t(`metricSelector.charts.${chart}`, { defaultValue: chart });
  };

  const getTypeIcon = (type: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'numeric': <Hash className="w-3 h-3" />,
      'text': <FileText className="w-3 h-3" />,
      'datetime': <Calendar className="w-3 h-3" />,
      'boolean': <CheckSquare className="w-3 h-3" />,
      'unknown': <HelpCircle className="w-3 h-3" />
    };
    return icons[type] || <HelpCircle className="w-3 h-3" />;
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'numeric': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      'text': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      'datetime': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      'boolean': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      'unknown': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  // Calcular si hay error para mostrar
  const hasError = selectedColumnInfo && selectedMetric &&
    !selectedColumnInfo.availableMetrics.includes(selectedMetric);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('metricSelector.configureChart')}</h3>

      <div className="space-y-4">
        {/* Selector de Columna */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {t('metricSelector.columnToAnalyze')}
          </label>
          <select
            value={selectedColumn}
            onChange={(e) => handleColumnChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-offset-0 dark:focus:ring-blue-500 dark:focus:border-blue-500 p-2"
          >
            <option value="">{t('metricSelector.selectColumn')}</option>
            {columnsInfo.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name}
              </option>
            ))}
          </select>

          {selectedColumnInfo && (
            <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedColumnInfo.type)} dark:bg-opacity-50`}>
              {getTypeIcon(selectedColumnInfo.type)} {selectedColumnInfo.type}
            </div>
          )}
        </div>

        {/* Selector de Métrica */}
        {selectedColumnInfo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('metricSelector.metricToCalculate')}
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => handleMetricChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-offset-0 dark:focus:ring-blue-500 dark:focus:border-blue-500 p-2"
            >
              <option value="">{t('metricSelector.selectMetric')}</option>
              {selectedColumnInfo.availableMetrics.map((metric) => (
                <option key={metric} value={metric}>
                  {getMetricLabel(metric)}
                </option>
              ))}
            </select>

            {selectedColumnInfo.availableMetrics.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('metricSelector.available')}: {selectedColumnInfo.availableMetrics.map(getMetricLabel).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Agrupación opcional */}
        {selectedColumnInfo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Agrupar por (opcional)
            </label>
            <select
              value={groupBy}
              onChange={(e) => handleGroupByChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-offset-0 dark:focus:ring-blue-500 dark:focus:border-blue-500 p-2"
            >
              <option value="">{t('metricSelector.noGrouping')}</option>
              {columnsInfo.filter(c => c.name !== selectedColumn).map((col) => (
                <option key={col.name} value={col.name}>
                  {getTypeIcon(col.type)} {col.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selector de Tipo de Gráfico */}
        {selectedColumnInfo && selectedMetric && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('metricSelector.chartType')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {selectedColumnInfo.availableCharts.map((chart) => (
                <button
                  key={chart}
                  type="button"
                  onClick={() => handleChartChange(chart)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    selectedChart === chart
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {getChartLabel(chart)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Título del gráfico */}
        {selectedColumn && selectedMetric && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('metricSelector.chartTitle')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={`${getMetricLabel(selectedMetric)} de ${selectedColumn}`}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-offset-0 dark:focus:ring-blue-500 dark:focus:border-blue-500 p-2"
            />
          </div>
        )}

        {/* Mensaje de Error */}
        {hasError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">
                  <strong>{t('metricSelector.noValidMetric')}</strong>
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {t('metricSelector.chooseValidMetric')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricSelector;

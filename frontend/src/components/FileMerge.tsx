import React, { useState } from 'react';
import axios from 'axios';

const FileMerge: React.FC = () => {
    const [files, setFiles] = useState<FileList | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [operation, setOperation] = useState('clean');
    const [keyColumns, setKeyColumns] = useState('');
    const [fillValue, setFillValue] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [normalizeAccents, setNormalizeAccents] = useState(true);
    const [normalizeWhitespace, setNormalizeWhitespace] = useState(true);
    const [keep, setKeep] = useState('first');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(e.target.files);
        }
    };

    const handleMerge = async () => {
        if (!files || files.length < 2) {
            alert('Selecciona al menos 2 archivos para combinar');
            return;
        }

        setLoading(true);
        const formData = new FormData();

        // Agregar todos los archivos
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        // Agregar parámetros
        console.log('>>> DEBUG: operation =', operation);
        console.log('>>> DEBUG: keyColumns =', keyColumns);
        console.log('>>> DEBUG: keep =', keep);
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
            setPreview(res.data);
            console.log('Archivos combinados:', res.data);
        } catch (err) {
            console.error('Error al combinar:', err);
            alert('Error al combinar los archivos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🔗 Combinar múltiples archivos</h2>

            {/* Selector de archivos */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona archivos (CSV o Excel)
                </label>
                <input
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files && (
                    <p className="text-sm text-gray-500 mt-1">
                        {files.length} archivo(s) seleccionado(s)
                    </p>
                )}
            </div>

            {/* Parámetros de limpieza */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Operación</label>
                    <select
                        value={operation}
                        onChange={(e) => setOperation(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="clean">Solo limpiar (normalizar)</option>
                        <option value="dropna">Eliminar nulos</option>
                        <option value="fillna">Rellenar nulos</option>
                        <option value="drop_duplicates">Eliminar duplicados</option>
                    </select>
                </div>

                {operation === 'fillna' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor para rellenar</label>
                        <input
                            type="text"
                            value={fillValue}
                            onChange={(e) => setFillValue(e.target.value)}
                            placeholder="Ej: DESCONOCIDO"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                )}

                {operation === 'drop_duplicates' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Columnas clave (separadas por coma)
                        </label>
                        <input
                            type="text"
                            value={keyColumns}
                            onChange={(e) => setKeyColumns(e.target.value)}
                            placeholder="Ej: email,cliente_id"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                )}

                {operation === 'drop_duplicates' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Conservar</label>
                        <select
                            value={keep}
                            onChange={(e) => setKeep(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="first">Primera ocurrencia</option>
                            <option value="last">Última ocurrencia</option>
                            <option value="false">Eliminar todas</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Opciones de normalización */}
            <div className="flex flex-wrap gap-4 mb-4">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={!caseSensitive}
                        onChange={(e) => setCaseSensitive(!e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span className="text-sm">Ignorar mayúsculas/minúsculas</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={normalizeAccents}
                        onChange={(e) => setNormalizeAccents(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span className="text-sm">Normalizar acentos (é → e)</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={normalizeWhitespace}
                        onChange={(e) => setNormalizeWhitespace(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span className="text-sm">Normalizar espacios</span>
                </label>
            </div>

            {/* Botón de acción */}
            <button
                onClick={handleMerge}
                disabled={!files || files.length < 2 || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
                {loading ? 'Combinando...' : 'Combinar archivos'}
            </button>

            {/* Resultado */}
            {preview && (
                <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-2">Resultado combinado</h3>
                    <p className="text-sm text-gray-600 mb-2">
                        <strong>Archivos procesados:</strong> {preview.files_processed} |
                        <strong> Filas originales:</strong> {preview.original_rows} |
                        <strong> Filas finales:</strong> {preview.transformed_rows}
                    </p>
                    <p className="text-sm text-green-600 mb-2">{preview.message}</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    {preview.columns?.map((col: string) => (
                                        <th key={col} className="border px-3 py-2 text-left">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.preview?.map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        {preview.columns.map((col: string) => (
                                            <td key={col} className="border px-3 py-2">{row[col]}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {preview.transformed_rows > preview.preview?.length && (
                            <p className="text-sm text-gray-500 mt-2">
                                Mostrando {preview.preview?.length} de {preview.transformed_rows} filas
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileMerge;
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import React, { useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { cn, generateId, generatePreviewLine } from './lib/utils';
import { MarquillaData, BlockInstance, BlockTemplate } from './types';
import { VARIABLES, SEPARATORS, DUMMY_DATA } from './constants';
import { Palette } from './components/Palette';
import { MarquillaConfig } from './components/MarquillaConfig';
import { PreviewPanel } from './components/PreviewPanel';
import { Upload, Download, RefreshCw, Save, FolderOpen, X, DownloadCloud, Trash2 } from 'lucide-react';

interface SavedStructure {
  id: string;
  date: string;
  data: MarquillaData[];
}

// Help deeply clone the state to avoid React Strict Mode double-invocation mutations
const cloneMarquillas = (marquillas: MarquillaData[]): MarquillaData[] => {
  return marquillas.map(m => ({
    ...m,
    lines: m.lines.map(l => ({
      ...l,
      blocks: [...l.blocks]
    }))
  }));
};

export default function App() {
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Capturar errores en tiempo de ejecución
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setRuntimeError(event.message);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const [globalSeparator, setGlobalSeparator] = useState<string>('-');
  const [excelData, setExcelData] = useState<Record<string, string>[]>([]);

  if (runtimeError) {
    return (
      <div className="p-20 bg-red-50 text-red-800 font-mono border-4 border-red-500">
        <h1 className="text-2xl font-bold mb-4">Error Detectado:</h1>
        <p className="bg-white p-4 border border-red-200">{runtimeError}</p>
        <button className="mt-4 btn-brutal bg-white" onClick={() => window.location.reload()}>Recargar página</button>
      </div>
    );
  }

  const [dynamicVariables, setDynamicVariables] = useState<BlockTemplate[]>(VARIABLES);
  const [marquillas, setMarquillas] = useState<MarquillaData[]>([
    { id: 'marquilla-1', name: 'MARQUILLA 1 ESTRUCTURA', lines: [{ id: 'm1-l1', blocks: [] }, { id: 'm1-l2', blocks: [] }, { id: 'm1-l3', blocks: [] }] },
    { id: 'marquilla-2', name: 'MARQUILLA 2 ESTRUCTURA', lines: [{ id: 'm2-l1', blocks: [] }, { id: 'm2-l2', blocks: [] }, { id: 'm2-l3', blocks: [] }] }
  ]);
  
  const [savedStructures, setSavedStructures] = useState<SavedStructure[]>(() => {
    try {
      const saved = localStorage.getItem('marquillas_saved');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSavedViewer, setShowSavedViewer] = useState(false);
  const [notification, setNotification] = useState("");
  const [previewRowIndex, setPreviewRowIndex] = useState(0);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleReset = () => {
    // Solo limpiamos las estructuras del lienzo para que el usuario pueda armarlas de nuevo
    // sin perder el archivo Excel que ya importó, evitando que le vuelva a salir el bloqueo.
    setMarquillas([
      { id: 'marquilla-1', name: 'MARQUILLA 1 ESTRUCTURA', lines: [{ id: 'm1-l1', blocks: [] }, { id: 'm1-l2', blocks: [] }, { id: 'm1-l3', blocks: [] }] },
      { id: 'marquilla-2', name: 'MARQUILLA 2 ESTRUCTURA', lines: [{ id: 'm2-l1', blocks: [] }, { id: 'm2-l2', blocks: [] }, { id: 'm2-l3', blocks: [] }] }
    ]);
    showNotice("Lienzo de estructuras limpiado");
  };

  const handleSaveStructure = () => {
    const newSave: SavedStructure = {
      id: generateId(),
      date: new Date().toLocaleString(),
      data: cloneMarquillas(marquillas)
    };
    const updated = [newSave, ...savedStructures];
    setSavedStructures(updated);
    localStorage.setItem('marquillas_saved', JSON.stringify(updated));
    showNotice("Estructura guardada exitosamente");
  };

  const handleLoadStructure = (structureData: MarquillaData[]) => {
    setMarquillas(cloneMarquillas(structureData));
    setShowSavedViewer(false);
    showNotice("Estructura cargada al lienzo");
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedStructures.filter(s => s.id !== id);
    setSavedStructures(updated);
    localStorage.setItem('marquillas_saved', JSON.stringify(updated));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // 1. DESCOMBINAR (Unmerge) celdas nativas de Excel
        if (ws['!merges']) {
          ws['!merges'].forEach((merge: any) => {
            const startCellName = XLSX.utils.encode_cell(merge.s);
            const startCell = ws[startCellName];
            if (!startCell) return;
            for (let r = merge.s.r; r <= merge.e.r; r++) {
              for (let c = merge.s.c; c <= merge.e.c; c++) {
                if (r === merge.s.r && c === merge.s.c) continue;
                ws[XLSX.utils.encode_cell({ r: r, c: c })] = { ...startCell };
              }
            }
          });
          delete ws['!merges'];
        }

        // Leer todo como matiz 2D para encontrar la "Fila de Encabezados" real
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (rawRows.length === 0) {
          showNotice("El archivo Excel parece estar vacío.");
          return;
        }

        // Función rápida de limpieza para detectar keywords
        const quickClean = (s: any) => String(s || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, '');
        const targetKeywords = ['TAG', 'BORNERA', 'BORNE', 'ORIGEN', 'DESTINO', 'DESDE', 'HACIA', 'EQUIPO'];
        
        let bestRowIdx = 0;
        let maxMatches = -1;

        // Buscar qué fila tiene más palabras clave (típicamente los títulos reales)
        for (let r = 0; r < Math.min(rawRows.length, 20); r++) { // Buscar en las primeras 20 filas
          const rowStrings = rawRows[r].map(cell => quickClean(cell));
          const matches = rowStrings.filter(cellStr => targetKeywords.some(kw => cellStr.includes(kw))).length;
          
          if (matches > maxMatches) {
            maxMatches = matches;
            bestRowIdx = r;
          }
        }

        // Construir encabezados únicos
        let rawHeaders = rawRows[bestRowIdx].map(h => String(h || '').trim());
        const uniqueHeaders: string[] = [];
        rawHeaders.forEach((h, i) => {
          let newH = h || `COL_${i}`;
          let counter = 1;
          while (uniqueHeaders.includes(newH)) {
            newH = `${h}_${counter}`;
            counter++;
          }
          uniqueHeaders.push(newH);
        });

        // Construir el data array a partir de la fila siguiente a los encabezados
        const data: Record<string, string>[] = [];
        for (let i = bestRowIdx + 1; i < rawRows.length; i++) {
          const rowData = rawRows[i];
          const rowObj: Record<string, string> = {};
          let rowHasVal = false;
          
          uniqueHeaders.forEach((uh, colIdx) => {
            const val = rowData[colIdx];
            rowObj[uh] = val !== undefined ? String(val) : "";
            if (rowObj[uh] !== "") rowHasVal = true;
          });
          
          if (rowHasVal) data.push(rowObj);
        }

        if (data.length > 0) {
          const headers = uniqueHeaders;

            // 2. RELLENAR HACIA ABAJO (Fill Down) celdas vacías
            let previousRow = { ...data[0] };
            for (let i = 1; i < data.length; i++) {
              headers.forEach(header => {
                let cellValue = data[i][header];
                if (cellValue === undefined || cellValue === null || String(cellValue).trim() === "") {
                  data[i][header] = previousRow[header];
                } else {
                  previousRow[header] = cellValue;
                }
              });
            }
  
            setExcelData(data);
            setPreviewRowIndex(0);
          
          // Crear variables desde los headers limpiando saltos de línea para el label visible
          const newVars: BlockTemplate[] = headers.map((header, i) => {
            const cleanLabel = header.replace(/[\r\n]+/g, ' ').trim();
            return {
              id: `var-${i}`,
              type: 'variable',
              label: cleanLabel.length > 20 ? cleanLabel.substring(0, 20) + '...' : cleanLabel,
              fieldName: header // Mantenemos el campo exacto de la llave del objeto para la evaluación de datos
            };
          });
          setDynamicVariables(newVars);

          // 3. AUTO-CONSTRUIR BLOQUES SI SE ENCUENTRAN LAS COLUMNAS CLAVE
          // Limpieza estricta: elimina tildes, símbolos, espacios y saltos de línea para comparar puramente letras/números
          const cleanStr = (s: string) => s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, '');
          
          const findCol = (kws: string[], excludeCol?: string) => {
            // 1. Prioridad: Coincidencia exacta tras limpieza (Ej: "BORNERA \n 1" === "BORNERA1")
            let match = headers.find(h => h !== excludeCol && kws.some(k => cleanStr(h) === cleanStr(k)));
            // 2. Prioridad: Coincidencia parcial (Ej: "BORNERA DEST" incluye "BORNERA")
            if (!match) {
              match = headers.find(h => h !== excludeCol && kws.some(k => cleanStr(h).includes(cleanStr(k))));
            }
            return match;
          };

          const colTag = findCol(["TAG CABLE SWC", "TAG CABLE", "TAG"]);
          const colTagName = findCol(["TAGNAME", "TAG NAME", "EQUIPO"]);
          const colDesde = findCol(["DESDE", "ORIGEN"]);
          
          // Si en el archivo original hay dos "BORNERA" y dos "BORNE" iguales, 
          // xlsx renombra el segundo a "BORNERA_1". 
          // Pasamos excludeCol (el colBorn1) en la segunda búsqueda para que no se pegue el mismo dato.
          const colBorn1 = findCol(["BORNERA 1", "BORNERA1", "BORN 1", "BORN1", "BORNERA", "BORN"]);
          const colBo1 = findCol(["BORNE 1", "BORNE1", "BO 1", "BO1", "BORNE", "BO"]);
          
          const colHacia = findCol(["HACIA", "DESTINO"]);
          
          const colBorn2 = findCol(["BORNERA 2", "BORNERA2", "BORN 2", "BORN2", "BORNERA_1", "BORNERA"], colBorn1);
          const colBo2 = findCol(["BORNE 2", "BORNE2", "BO 2", "BO2", "BORNE_1", "BORNE"], colBo1);

          const getVarTpl = (colName?: string) => newVars.find(v => v.fieldName === colName);
          
          const buildLine = (cols: (string | undefined)[]) => {
            const blocks: BlockInstance[] = [];
            const colTemplates = cols.map(c => getVarTpl(c)).filter(Boolean) as BlockTemplate[];
            const defaultSepTemplate = SEPARATORS.find(s => s.value === globalSeparator);

            colTemplates.forEach((tpl, idx) => {
              blocks.push({ ...tpl, instanceId: `inst-${generateId()}` });
              // Agregar separador entre las variables que existan
              if (idx < colTemplates.length - 1 && defaultSepTemplate) {
                blocks.push({ ...defaultSepTemplate, instanceId: `inst-${generateId()}` });
              }
            });
            return blocks;
          };

          const m1BlocksL1 = buildLine([colTag]);
          const m1BlocksL2 = buildLine([colTagName, colDesde, colBorn1, colBo1]);
          const m1BlocksL3 = buildLine([colHacia, colBorn2, colBo2]);

          const m2BlocksL1 = buildLine([colTag]);
          const m2BlocksL2 = buildLine([colHacia, colBorn2, colBo2]);
          const m2BlocksL3 = buildLine([colTagName, colDesde, colBorn1, colBo1]);

          setMarquillas([
            {
              id: 'marquilla-1',
              name: 'MARQUILLA 1 ESTRUCTURA',
              lines: [
                { id: 'm1-l1', blocks: m1BlocksL1 },
                { id: 'm1-l2', blocks: m1BlocksL2 },
                { id: 'm1-l3', blocks: m1BlocksL3 },
              ]
            },
            {
              id: 'marquilla-2',
              name: 'MARQUILLA 2 ESTRUCTURA',
              lines: [
                { id: 'm2-l1', blocks: m2BlocksL1 },
                { id: 'm2-l2', blocks: m2BlocksL2 },
                { id: 'm2-l3', blocks: m2BlocksL3 },
              ]
            }
          ]);

        } else {
          showNotice("El archivo Excel parece estar vacío.");
        }
      } catch (error) {
        showNotice("Error al procesar el archivo Excel.");
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input to allow uploading same file again
  };

  const handleExport = () => {
    if (!excelData || excelData.length === 0) {
      showNotice("Por favor importa un archivo Excel primero.");
      return;
    }

    const exportData = excelData.map(row => {
      // Create a fresh object to ONLY include the structure outputs
      const rowOutput: Record<string, string> = {};
      
      marquillas.forEach(mq => {
        const mqLines = mq.lines
          .map(line => generatePreviewLine(line.blocks, row))
          .filter(text => text.trim() !== '');
        
        rowOutput[mq.name] = mqLines.join('\n'); // Combinar lineas con un salto
      });
      
      return rowOutput;
    });

    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.json_to_sheet(exportData);

    // Ajuste visual del ancho de las columnas
    newWs['!cols'] = [{ wch: 45 }, { wch: 45 }];
    
    // INYECCIÓN DE ESTILOS (Ajustar Texto / Wrap Text)
    if (newWs['!ref']) {
      const range = XLSX.utils.decode_range(newWs['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!newWs[cellRef]) continue;
          
          newWs[cellRef].s = {
            alignment: { wrapText: true, vertical: "top" }
          };
          
          // Estilo encabezados
          if (R === 0) {
            newWs[cellRef].s.font = { bold: true, color: { rgb: "000000" } };
            newWs[cellRef].s.fill = { fgColor: { rgb: "EFEFEF" } };
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(newWb, newWs, "Marquillas");
    XLSX.writeFile(newWb, "marquillas_exportadas.xlsx");
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (source.droppableId === 'palette-variables' || source.droppableId === 'palette-separators') {
      const paletteSource = source.droppableId === 'palette-variables' ? dynamicVariables : SEPARATORS;
      const templateItem = paletteSource[source.index];
      
      const newInstance: BlockInstance = {
        ...templateItem,
        instanceId: `inst-${generateId()}`
      };

      setMarquillas(prev => {
        const nextState = cloneMarquillas(prev);
        for (const m of nextState) {
          const line = m.lines.find(l => l.id === destination.droppableId);
          if (line) {
            const itemsToInsert: BlockInstance[] = [];
            const defaultSepTemplate = SEPARATORS.find(s => s.value === globalSeparator);

            if (templateItem.type === 'variable' && defaultSepTemplate) {
              const blockBefore = line.blocks[destination.index - 1];
              const blockAfter = line.blocks[destination.index];

              if (blockBefore && blockBefore.type === 'variable') {
                itemsToInsert.push({ ...defaultSepTemplate, instanceId: `inst-${generateId()}` });
              }
              itemsToInsert.push(newInstance);
              if (blockAfter && blockAfter.type === 'variable') {
                itemsToInsert.push({ ...defaultSepTemplate, instanceId: `inst-${generateId()}` });
              }
            } else {
              itemsToInsert.push(newInstance);
            }

            line.blocks.splice(destination.index, 0, ...itemsToInsert);
            break;
          }
        }
        return nextState;
      });
      return;
    }

    setMarquillas(prev => {
      const nextState = cloneMarquillas(prev);
      let sourceLine: any = null;
      let destLine: any = null;
      
      for (const m of nextState) {
        if (!sourceLine) sourceLine = m.lines.find(l => l.id === source.droppableId);
        if (!destLine) destLine = m.lines.find(l => l.id === destination.droppableId);
      }

      if (sourceLine && destLine) {
        const [movedBlock] = sourceLine.blocks.splice(source.index, 1);
        destLine.blocks.splice(destination.index, 0, movedBlock);
      }
      return nextState;
    });
  };

  const removeBlock = (lineId: string, instanceId: string) => {
    setMarquillas(prev => {
      const nextState = cloneMarquillas(prev);
      for (const m of nextState) {
        const line = m.lines.find(l => l.id === lineId);
        if (line) {
          line.blocks = line.blocks.filter(b => b.instanceId !== instanceId);
          break;
        }
      }
      return nextState;
    });
  };

  const updateBlockHeader = (lineId: string, instanceId: string, newHeader: string) => {
    setMarquillas(prev => {
      const nextState = cloneMarquillas(prev);
      for (const m of nextState) {
        const line = m.lines.find(l => l.id === lineId);
        if (line) {
          const block = line.blocks.find(b => b.instanceId === instanceId);
          if (block) {
            block.fieldName = newHeader;
          }
          break;
        }
      }
      return nextState;
    });
  };

  const currentPreviewData = excelData.length > 0 ? excelData[previewRowIndex] : DUMMY_DATA;

  return (
    <div className="h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] flex flex-col font-sans overflow-hidden">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[70] bg-[var(--color-ink)] text-white px-6 py-3 font-bold uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] animate-bounce border-2 border-white">
          {notification}
        </div>
      )}

      {/* SAVED STRUCTURES VIEWER MODAL */}
      {showSavedViewer && (
        <div className="absolute inset-0 z-[60] bg-[var(--color-canvas)]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[var(--color-ink)] p-8 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] w-full max-w-2xl max-h-[80vh] flex flex-col transform transition-transform animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black uppercase tracking-tight">Estructuras Guardadas</h2>
              <button className="btn-brutal p-2 hover:bg-red-100" onClick={() => setShowSavedViewer(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {savedStructures.length === 0 ? (
                <p className="text-gray-500 font-bold text-center py-8">No hay estructuras guardadas aún.</p>
              ) : (
                savedStructures.map(s => (
                  <div key={s.id} className="border-2 border-[var(--color-ink)] p-4 flex justify-between items-center bg-[var(--color-block-a)]">
                    <div>
                      <p className="font-bold text-lg">Estructura Personalizada</p>
                      <p className="text-xs font-mono font-bold text-gray-700 bg-white inline-block px-1 mt-1 border border-black">{s.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-brutal bg-white p-2 hover:bg-green-100 text-green-700" title="Cargar al lienzo" onClick={() => handleLoadStructure(s.data)}>
                        <DownloadCloud className="w-5 h-5" />
                      </button>
                      <button className="btn-brutal bg-white p-2 hover:bg-red-100 text-red-600" title="Eliminar" onClick={() => handleDeleteSaved(s.id)}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <header className="h-[70px] bg-white border-b-2 border-[var(--color-ink)] px-10 flex items-center justify-between z-20 shrink-0 overflow-x-auto gap-4">
        <div className="text-2xl font-black tracking-tighter uppercase flex items-center whitespace-nowrap">
          Logic.Marquillas
          <span className="text-[10px] px-2 py-0.5 bg-[var(--color-ink)] text-white rounded-full align-middle ml-3 tracking-normal">V2.0</span>
        </div>
        <div className="flex gap-3">
          <button className="btn-brutal flex items-center gap-2 bg-[#ffcaca] hover:bg-[#ffb0b0]" onClick={handleReset} title="Limpiar lienzo de estructuras">
             <RefreshCw className="w-4 h-4 hidden sm:block" /> Limpiar
          </button>

          <label className="btn-brutal flex items-center gap-2 cursor-pointer bg-[var(--color-block-a)] hover:bg-[#c1d1c4]">
             <Upload className="w-4 h-4 hidden sm:block" /> Importar Excel
             <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          </label>
          <button className="btn-brutal flex items-center gap-2 bg-[var(--color-block-b)] hover:bg-[#d6b8ba]" onClick={handleExport}>
            <Download className="w-4 h-4 hidden sm:block" /> Exportar Resultado
          </button>
          
          <div className="w-0.5 h-auto bg-[var(--color-ink)]/10 mx-1"></div>
          
          <button className="btn-brutal flex items-center gap-2 bg-[#fdf2b3] hover:bg-[#fce98a]" onClick={() => setShowSavedViewer(true)}>
            <FolderOpen className="w-4 h-4 hidden sm:block" /> Historial
          </button>

          <button className="btn-brutal btn-brutal-primary flex items-center gap-2" onClick={handleSaveStructure}>
            <Save className="w-4 h-4 hidden sm:block" /> Guardar
          </button>
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* OVERLAY BLOQUEANTE: PASO 1 (IMPORTAR) */}
          {excelData.length === 0 && (
            <div className="absolute inset-0 z-50 bg-[var(--color-canvas)]/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-[var(--color-block-a)] border-4 border-[var(--color-ink)] p-12 text-center shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] max-w-2xl transform transition-transform hover:-translate-y-1">
                <div className="bg-white border-2 border-[var(--color-ink)] inline-block p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] rotate-3">
                  <Upload className="w-12 h-12 text-[var(--color-ink)]" />
                </div>
                <h2 className="text-4xl font-black uppercase mb-4 tracking-tight">Paso 1: Sube tu Excel</h2>
                <p className="font-bold text-gray-800 mb-8 text-lg">
                  Para extraer las variables de las columnas y armar la estructura visual de las marquillas, debes importar tu archivo base obligatorio.
                </p>
                <label className="btn-brutal inline-flex items-center gap-3 cursor-pointer bg-white hover:bg-gray-50 text-xl py-4 px-8 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:translate-y-1 hover:translate-x-1 transition-all">
                  <Upload className="w-6 h-6" /> Importar Archivo
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {/* Sidebar */}
          <div className="w-[300px] border-r-2 border-[var(--color-ink)] bg-white overflow-y-auto flex-shrink-0 z-10">
            <Palette globalSeparator={globalSeparator} setGlobalSeparator={setGlobalSeparator} variables={dynamicVariables} />
          </div>

          {/* Main Area */}
          <div className="flex-1 overflow-y-auto canvas-pattern p-10 flex flex-col items-center gap-16 pb-20">
            
            {excelData.length > 0 && (
              <div className="bg-[var(--color-ink)] text-white px-6 py-3 font-mono text-sm flex items-center justify-between w-full max-w-[1000px] border-2 border-white shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] z-10 sticky top-0">
                <span className="font-bold uppercase tracking-wider">Fila {previewRowIndex + 1} de {excelData.length} en Excel</span>
                <div className="flex gap-4">
                  <button 
                    className="px-4 py-1 bg-white text-black font-black uppercase tracking-wider disabled:opacity-50 hover:bg-gray-200 border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
                    onClick={() => setPreviewRowIndex(prev => Math.max(0, prev - 1))}
                    disabled={previewRowIndex === 0}
                  >
                    Anterior
                  </button>
                  <button 
                    className="px-4 py-1 bg-white text-black font-black uppercase tracking-wider disabled:opacity-50 hover:bg-gray-200 border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
                    onClick={() => setPreviewRowIndex(prev => Math.min(excelData.length - 1, prev + 1))}
                    disabled={previewRowIndex === excelData.length - 1}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {marquillas.map((marquilla) => (
              <div key={marquilla.id} className="w-full max-w-[1000px] flex gap-10">
                {/* Structure Editor */}
                <div className="flex-1 min-w-0">
                  <MarquillaConfig 
                    marquilla={marquilla} 
                    onRemoveBlock={removeBlock} 
                    onUpdateBlockHeader={updateBlockHeader}
                  />
                </div>
                
                {/* Live Preview */}
                <div className="w-[320px] flex-shrink-0">
                  <PreviewPanel marquilla={marquilla} dummyData={currentPreviewData} />
                </div>
              </div>
            ))}
          </div>

          {/* ALERTA FLOTANTE: PASO 2 (EXPORTAR) */}
          {excelData.length > 0 && (
            <div className="absolute bottom-10 right-10 z-50 animate-bounce">
              <div className="bg-[var(--color-block-b)] border-4 border-[var(--color-ink)] p-5 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex items-center gap-6">
                <div className="text-left">
                  <span className="bg-white text-[var(--color-ink)] text-[11px] font-black px-2 py-1 uppercase tracking-widest border-2 border-[var(--color-ink)] block w-fit mb-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">Paso 2</span>
                  <p className="font-bold text-base uppercase tracking-tight text-[var(--color-ink)]">¿Estructura Lista?</p>
                </div>
                <button 
                  className="btn-brutal bg-white hover:bg-gray-50 flex items-center gap-2 py-3 px-5 text-[var(--color-ink)] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:shadow-[0px_0px_0px_0px_rgba(26,26,26,1)] hover:translate-y-1 hover:translate-x-1 transition-all" 
                  onClick={handleExport}
                >
                  <Download className="w-5 h-5" /> Exportar Ahora
                </button>
              </div>
            </div>
          )}

        </div>
      </DragDropContext>
    </div>
  );
}

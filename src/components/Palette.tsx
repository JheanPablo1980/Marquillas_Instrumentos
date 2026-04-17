import { Droppable, Draggable } from '@hello-pangea/dnd';
import { SEPARATORS } from '../constants';
import { BlockTemplate } from '../types';
import { cn } from '../lib/utils';
import { Settings, Hash, Minus, Maximize2 } from 'lucide-react';

interface PaletteProps {
  globalSeparator: string;
  setGlobalSeparator: (s: string) => void;
  variables: BlockTemplate[];
}

export function Palette({ globalSeparator, setGlobalSeparator, variables }: PaletteProps) {
  return (
    <div className="p-8 space-y-10 bg-white">
      
      {/* SEPARATOR CONFIGURATION */}
      <div>
        <div className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" /> Configuración
        </div>
        
        <div className="modern-border p-4 bg-gray-50/50">
          <label className="text-xs font-semibold text-gray-600 block mb-2">Separador Automático</label>
          <select 
            className="w-full text-sm p-2.5 modern-border bg-white font-mono font-medium outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-50 focus:border-transparent"
            value={globalSeparator}
            onChange={(e) => setGlobalSeparator(e.target.value)}
          >
            <option value="">(Ninguno)</option>
            {SEPARATORS.map(s => <option key={`opt-${s.id}`} value={s.value}>{s.label}</option>)}
          </select>
          <p className="text-[10px] text-gray-400 mt-3 font-medium leading-relaxed">
            * Se insertará al momento de ubicar una variable al lado de otra para unir los flujos.
          </p>
        </div>
      </div>

      {/* SEPARATORS LIST */}
      <div>
        <div className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <Minus className="w-4 h-4" /> Separadores Drop
        </div>
        
        <Droppable droppableId="palette-separators" isDropDisabled={true}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "grid grid-cols-2 gap-3",
                snapshot.isDraggingOver ? "opacity-50" : ""
              )}
            >
              {SEPARATORS.map((item, index) => (
                // @ts-ignore
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          "h-[50px] flex items-center justify-center modern-border bg-white cursor-grab transition-all",
                          snapshot.isDragging ? "shadow-xl scale-105 z-50 text-blue-600 border-blue-200" : "hover:-translate-y-0.5 hover:shadow-sm text-gray-600 hover:border-gray-300"
                        )}
                        style={provided.draggableProps.style}
                        title={item.label}
                      >
                        <span className="font-bold font-mono text-xl">{item.value === ' ' ? '␣' : item.value}</span>
                      </div>
                      
                      {snapshot.isDragging && (
                        <div className="h-[50px] flex items-center justify-center modern-border border-dashed bg-gray-50 opacity-40">
                           <span className="font-bold text-gray-400 font-mono text-xl">{item.value === ' ' ? '␣' : item.value}</span>
                        </div>
                      )}
                    </>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      {/* VARIABLES LIST */}
      <div>
        <div className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4" /> Variables {variables.length === 0 && "(Importe un Excel)"}
        </div>
        
        <Droppable droppableId="palette-variables" isDropDisabled={true}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "space-y-3",
                snapshot.isDraggingOver ? "opacity-50" : ""
              )}
            >
              {variables.map((item, index) => (
                // @ts-ignore
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          "w-full h-[54px] modern-border flex items-center justify-between px-4 font-semibold text-sm bg-white cursor-grab transition-all relative group",
                          snapshot.isDragging ? "shadow-2xl scale-105 border-blue-300 ring-2 ring-blue-100 z-50 text-blue-800" : "hover:-translate-y-0.5 hover:shadow-sm hover:border-gray-300 text-gray-700"
                        )}
                        style={provided.draggableProps.style}
                      >
                        <span className="truncate pr-4 relative z-10">{item.label}</span>
                        <Maximize2 className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      {/* Keep item in palette when dragging a copy */}
                      {snapshot.isDragging && (
                        <div className="w-full h-[54px] modern-border border-dashed flex items-center justify-between px-4 font-semibold text-sm bg-gray-50 opacity-40 text-gray-400">
                          {item.label}
                        </div>
                      )}
                    </>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}

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
    <div className="p-8 space-y-12 bg-white">
      
      {/* SEPARATOR CONFIGURATION */}
      <div>
        <div className="text-[11px] uppercase tracking-[2px] font-bold text-[var(--color-ink)]/60 mb-6 flex items-center gap-2">
          <Settings className="w-4 h-4" /> Configuración
        </div>
        
        <div className="brutalist-border p-4 bg-[#fafafa]">
          <label className="text-[10px] uppercase font-bold text-[var(--color-ink)] block mb-3 tracking-wider">Separador Automático</label>
          <select 
            className="w-full text-base p-2 brutalist-border bg-white font-mono font-bold outline-none cursor-pointer focus:ring-2 focus:ring-[var(--color-primary)] transition-all hover:bg-slate-50"
            value={globalSeparator}
            onChange={(e) => setGlobalSeparator(e.target.value)}
          >
            <option value="">(Ninguno)</option>
            {SEPARATORS.map(s => <option key={`opt-${s.id}`} value={s.value}>{s.label}</option>)}
          </select>
          <p className="text-[9px] text-[var(--color-ink)]/50 mt-3 font-semibold">
            * Se insertará al momento de ubicar una variable al lado de otra para unir los flujos.
          </p>
        </div>
      </div>

      {/* SEPARATORS LIST */}
      <div>
        <div className="text-[11px] uppercase tracking-[2px] font-bold text-[var(--color-ink)]/60 mb-6 flex items-center gap-2">
          <Minus className="w-4 h-4" /> Separadores Drop
        </div>
        
        <Droppable droppableId="palette-separators" isDropDisabled={true}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "grid grid-cols-2 gap-4",
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
                          "h-[60px] flex items-center justify-center brutalist-border bg-[#fafafa] cursor-grab transition-transform",
                          snapshot.isDragging ? "shadow-xl rotate-2 bg-white" : "hover:-translate-y-0.5 hover:shadow-md"
                        )}
                        style={provided.draggableProps.style}
                        title={item.label}
                      >
                        <span className="font-bold text-[var(--color-ink)] font-mono text-xl">{item.value === ' ' ? '␣' : item.value}</span>
                      </div>
                      
                      {snapshot.isDragging && (
                        <div className="h-[60px] flex items-center justify-center brutalist-border border-dashed bg-[#fafafa] opacity-50">
                           <span className="font-bold text-[var(--color-ink)] font-mono text-xl">{item.value === ' ' ? '␣' : item.value}</span>
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
        <div className="text-[11px] uppercase tracking-[2px] font-bold text-[var(--color-ink)]/60 mb-6 flex items-center gap-2">
          <Hash className="w-4 h-4" /> Variables {variables.length === 0 && "(Importe un Excel)"}
        </div>
        
        <Droppable droppableId="palette-variables" isDropDisabled={true}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "space-y-4",
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
                          "w-full h-[60px] brutalist-border flex items-center justify-center font-bold text-[13px] bg-[#fafafa] cursor-grab transition-transform relative group",
                          snapshot.isDragging ? "shadow-xl rotate-2 bg-white z-50" : "hover:-translate-y-0.5 hover:shadow-md"
                        )}
                        style={provided.draggableProps.style}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[var(--color-ink)]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10">{item.label}</span>
                        <Maximize2 className="absolute right-3 w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />
                      </div>
                      
                      {/* Keep item in palette when dragging a copy */}
                      {snapshot.isDragging && (
                        <div className="w-full h-[60px] brutalist-border border-dashed flex items-center justify-center font-bold text-[13px] bg-[#fafafa] opacity-50">
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

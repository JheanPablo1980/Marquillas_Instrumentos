import { Droppable, Draggable } from '@hello-pangea/dnd';
import { MarquillaData, BlockInstance } from '../types';
import { cn } from '../lib/utils';
import { X, Edit2, Copy } from 'lucide-react';
import { useState } from 'react';

interface MarquillaConfigProps {
  marquilla: MarquillaData;
  onRemoveBlock: (lineId: string, instanceId: string) => void;
  onUpdateBlockHeader: (lineId: string, instanceId: string, newHeader: string) => void;
  onCopyM1toM2?: () => void;
}

export function MarquillaConfig({ marquilla, onRemoveBlock, onUpdateBlockHeader, onCopyM1toM2 }: MarquillaConfigProps) {
  return (
    <div className="bg-white modern-border modern-shadow p-8 relative mt-4 rounded-xl">
      <div className="absolute -top-3 left-6 flex items-center gap-3">
        <span className="bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border border-blue-100 shadow-sm">
          {marquilla.name}
        </span>
        {onCopyM1toM2 && (
          <button 
            onClick={onCopyM1toM2}
            className="btn-modern py-1 px-3 bg-white hover:bg-blue-50 hover:text-blue-700 text-xs shadow-sm border border-gray-200"
            title="Generar usando M1 (Invierte líneas 2 y 3)"
          >
            <Copy className="w-3 h-3" /> Clonar y Voltear desde M1
          </button>
        )}
      </div>
      
      <div className="space-y-6 mt-4">
        {marquilla.lines.map((line, index) => (
          <div key={line.id} className="flex gap-4">
            <div className="flex-shrink-0 pt-4 w-16">
              <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                Línea {index + 1}
              </span>
            </div>
            
            <Droppable droppableId={line.id} direction="horizontal">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "flex-1 min-h-[120px] border-2 border-dashed rounded-xl border-gray-300 bg-gray-50/50 p-4 flex flex-wrap gap-4 items-end transition-colors",
                    snapshot.isDraggingOver ? "bg-blue-50/50 border-solid border-blue-400" : ""
                  )}
                >
                  {line.blocks.length === 0 && !snapshot.isDraggingOver && (
                    <span className="text-gray-400 text-sm font-medium mx-auto mb-auto mt-6">Arrastra bloques aquí</span>
                  )}
                  
                  {line.blocks.map((block, i) => (
                    <BlockItem 
                      key={block.instanceId} 
                      block={block} 
                      index={i} 
                      onRemove={() => onRemoveBlock(line.id, block.instanceId)}
                      onUpdateHeader={(newHeader) => onUpdateBlockHeader(line.id, block.instanceId, newHeader)}
                    />
                  ))}
                  
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockItem({ block, index, onRemove, onUpdateHeader }: { key?: string; block: BlockInstance; index: number; onRemove: () => void; onUpdateHeader: (h: string) => void }) {
  const isVar = block.type === 'variable';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.fieldName || '');

  const finishEdit = () => {
    setIsEditing(false);
    if(editValue.trim() !== '') {
       onUpdateHeader(editValue);
    }
  };

  return (
    // @ts-ignore
    <Draggable draggableId={block.instanceId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group relative flex items-center justify-center transition-transform",
            snapshot.isDragging ? "shadow-2xl scale-105 z-10" : ""
          )}
          style={provided.draggableProps.style}
        >
          {isVar ? (
            <div className="flex flex-col w-[160px] modern-shadow rounded-lg overflow-hidden border border-blue-200 bg-white">
              <div 
                className="bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-800 flex justify-between items-center cursor-text transition-colors hover:bg-blue-100 border-b border-blue-100"
                onClick={() => setIsEditing(true)}
              >
                {isEditing ? (
                  <input 
                    autoFocus
                    type="text"
                    className="bg-white border rounded px-1.5 py-0.5 w-full outline-none text-blue-900 focus:ring-2 focus:ring-blue-400"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={finishEdit}
                    onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); }}
                  />
                ) : (
                  <div className="w-full flex items-center justify-between gap-2">
                    <span className="truncate">{block.fieldName}</span>
                    <Edit2 className="w-[10px] h-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-blue-500" />
                  </div>
                )}
              </div>
              <div className="p-4 text-center font-bold text-xs text-gray-800 uppercase min-h-[50px] flex items-center justify-center relative">
                {block.label}
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 border border-gray-200 rounded-lg modern-shadow px-3 min-w-[50px] h-[50px] flex items-center justify-center font-mono font-bold text-2xl text-gray-600 relative pointer-events-none">
              {block.value === ' ' ? '␣' : block.value}
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -top-2 -right-2 bg-white text-gray-400 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm z-20 pointer-events-auto"
            title="Eliminar bloque"
          >
            <X className="w-3 h-3 font-bold" />
          </button>
        </div>
      )}
    </Draggable>
  );
}

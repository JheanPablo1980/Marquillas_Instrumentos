import { Droppable, Draggable } from '@hello-pangea/dnd';
import { MarquillaData, BlockInstance } from '../types';
import { cn } from '../lib/utils';
import { X, Edit2 } from 'lucide-react';
import { useState } from 'react';

interface MarquillaConfigProps {
  marquilla: MarquillaData;
  onRemoveBlock: (lineId: string, instanceId: string) => void;
  onUpdateBlockHeader: (lineId: string, instanceId: string, newHeader: string) => void;
}

export function MarquillaConfig({ marquilla, onRemoveBlock, onUpdateBlockHeader }: MarquillaConfigProps) {
  return (
    <div className="bg-white brutalist-border brutalist-shadow p-10 relative mt-4">
      <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-bold text-[var(--color-primary)]">
        {marquilla.name}
      </span>
      
      <div className="space-y-8 mt-2">
        {marquilla.lines.map((line, index) => (
          <div key={line.id} className="flex gap-6">
            <div className="flex-shrink-0 pt-4 w-16">
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">
                Línea {index + 1}
              </span>
            </div>
            
            <Droppable droppableId={line.id} direction="horizontal">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "flex-1 min-h-[120px] border-2 border-dashed border-[var(--color-ink)] bg-[#fafafa] p-4 flex flex-wrap gap-4 items-end transition-colors",
                    snapshot.isDraggingOver ? "bg-[var(--color-block-a)] border-solid border-[var(--color-ink)]" : ""
                  )}
                >
                  {line.blocks.length === 0 && !snapshot.isDraggingOver && (
                    <span className="text-[var(--color-ink)] opacity-50 text-[13px] font-bold mx-auto mb-auto mt-6">Arrastra bloques aquí</span>
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
            snapshot.isDragging ? "shadow-xl scale-105 z-10 rotate-2" : ""
          )}
          style={provided.draggableProps.style}
        >
          {isVar ? (
            <div className="flex flex-col w-[160px]">
              <div 
                className="bg-[var(--color-block-header)] px-3 py-2 brutalist-border border-b-0 text-[10px] font-bold flex justify-between items-center cursor-text transition-colors hover:bg-[#c1d1c4]"
                onClick={() => setIsEditing(true)}
              >
                {isEditing ? (
                  <input 
                    autoFocus
                    type="text"
                    className="bg-white border border-[var(--color-ink)] text-[10px] px-1 w-full outline-none py-0.5"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={finishEdit}
                    onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); }}
                  />
                ) : (
                  <div className="w-full flex items-center justify-between gap-2">
                    <span className="truncate">{block.fieldName}</span>
                    <Edit2 className="w-[10px] h-[10px] opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                  </div>
                )}
              </div>
              <div className="bg-[var(--color-block-var)] p-4 brutalist-border text-center font-bold text-[12px] uppercase min-h-[50px] flex items-center justify-center relative">
                {block.label}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-block-sep)] brutalist-border px-3 min-w-[50px] h-[50px] flex items-center justify-center font-mono font-black text-2xl text-[var(--color-ink)] relative pointer-events-none">
              {block.value === ' ' ? '␣' : block.value}
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -top-2 -right-2 bg-[var(--color-ink)] text-white w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-2 border-[var(--color-ink)] hover:bg-red-500 z-20 pointer-events-auto"
            title="Eliminar bloque"
          >
            <X className="w-3 h-3 font-bold" />
          </button>
        </div>
      )}
    </Draggable>
  );
}

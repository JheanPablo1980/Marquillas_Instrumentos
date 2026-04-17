import { MarquillaData } from '../types';
import { generatePreviewLine } from '../lib/utils';

interface PreviewPanelProps {
  marquilla: MarquillaData;
  dummyData: Record<string, string>;
}

export function PreviewPanel({ marquilla, dummyData }: PreviewPanelProps) {
  return (
    <div className="bg-white modern-border modern-shadow p-8 relative mt-4 rounded-xl">
      <span className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        Vista Previa Real
      </span>
      
      <div className="bg-white modern-border shadow-sm w-full relative mb-4 overflow-hidden rounded-lg">
        <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-2 bg-transparent">
          {marquilla.lines.map((line) => {
            const text = generatePreviewLine(line.blocks, dummyData); // Auto-separator logic removed from preview, keeping it real in canvas
            if (!text.trim() && line.blocks.length === 0) return null;
            
            return (
              <div key={line.id} className="text-[13px] font-mono font-medium text-gray-800 text-center whitespace-pre-wrap break-all w-full leading-relaxed">
                {text || ' '}
              </div>
            );
          })}
          
          {marquilla.lines.every(l => l.blocks.length === 0) && (
            <span className="text-gray-300 text-xs font-semibold uppercase tracking-widest">
              Vacío
            </span>
          )}
        </div>
      </div>
      
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-center mt-4">
        Mostrando datos simulados
      </div>
    </div>
  );
}

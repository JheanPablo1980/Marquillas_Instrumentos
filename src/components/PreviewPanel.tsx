import { MarquillaData } from '../types';
import { generatePreviewLine } from '../lib/utils';

interface PreviewPanelProps {
  marquilla: MarquillaData;
  dummyData: Record<string, string>;
}

export function PreviewPanel({ marquilla, dummyData }: PreviewPanelProps) {
  return (
    <div className="bg-white brutalist-border brutalist-shadow p-8 relative mt-4">
      <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
        Vista Previa
      </span>
      
      <div className="bg-white border-2 border-[var(--color-ink)] w-full relative mb-4">
        <div className="h-3 w-full bg-yellow-400 border-b-2 border-[var(--color-ink)]"></div>
        
        <div className="p-5 flex flex-col items-center justify-center min-h-[140px] gap-2">
          {marquilla.lines.map((line) => {
            const text = generatePreviewLine(line.blocks, dummyData); // Auto-separator logic removed from preview, keeping it real in canvas
            if (!text.trim() && line.blocks.length === 0) return null;
            
            return (
              <div key={line.id} className="text-[13px] font-mono font-bold text-[#1A1A1A] text-center whitespace-pre-wrap break-all w-full leading-relaxed">
                {text || ' '}
              </div>
            );
          })}
          
          {marquilla.lines.every(l => l.blocks.length === 0) && (
            <span className="text-[#1A1A1A]/40 text-xs font-bold uppercase tracking-wide">
              Vacío
            </span>
          )}
        </div>
      </div>
      
      <div className="text-[10px] font-bold text-[#1A1A1A]/50 uppercase tracking-widest text-center mt-6">
        Datos simulados
      </div>
    </div>
  );
}

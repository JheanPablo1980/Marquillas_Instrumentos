import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const generatePreviewLine = (blocks: any[], rowData: Record<string, string>, defaultSeparator?: string) => {
  const textParts = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    let textPart = '';
    
    if (block.type === 'variable') {
      if (rowData && block.fieldName && rowData.hasOwnProperty(block.fieldName)) {
        textPart = rowData[block.fieldName]; // Allow empty strings if cell is empty
      } else {
        textPart = `[${block.label}]`;
      }
    } else {
      textPart = block.value || '';
    }
      
    textParts.push(textPart);
    
    // Auto-insert configured default separator BETWEEN consecutive variable blocks
    if (defaultSeparator && i < blocks.length - 1) {
      const nextBlock = blocks[i + 1];
      if (block.type === 'variable' && nextBlock.type === 'variable') {
        textParts.push(defaultSeparator);
      }
    }
  }
  
  return textParts.join('');
};

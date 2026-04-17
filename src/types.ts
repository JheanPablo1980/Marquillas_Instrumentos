export type BlockType = 'variable' | 'separator';

export interface BlockTemplate {
  id: string; // Base ID
  type: BlockType;
  label: string;
  fieldName?: string; // Variable name mapping
  value?: string; // Text for separator
}

export interface BlockInstance extends BlockTemplate {
  instanceId: string; // Unique for each dropped element
}

export interface LineData {
  id: string;
  blocks: BlockInstance[];
}

export interface MarquillaData {
  id: string;
  name: string;
  lines: LineData[];
}

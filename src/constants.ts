import { BlockTemplate } from "./types";

export const VARIABLES: BlockTemplate[] = [
  { id: 'var-tag-cable', type: 'variable', label: 'Tag cable swc', fieldName: 'tagCable' },
  { id: 'var-tag-name', type: 'variable', label: 'tag name', fieldName: 'tagName' },
  { id: 'var-desde', type: 'variable', label: 'desde', fieldName: 'desde' },
  { id: 'var-bornera-1', type: 'variable', label: 'Bornera 1', fieldName: 'bornera1' },
  { id: 'var-borne-1', type: 'variable', label: 'borne 1', fieldName: 'borne1' },
  { id: 'var-hacia', type: 'variable', label: 'Hacia', fieldName: 'hacia' },
  { id: 'var-bornera-2', type: 'variable', label: 'BORNERA 2', fieldName: 'bornera2' },
  { id: 'var-borne-2', type: 'variable', label: 'BORNE 2', fieldName: 'borne2' },
];

export const SEPARATORS: BlockTemplate[] = [
  { id: 'sep-dash', type: 'separator', label: 'Guion (-)', value: '-' },
  { id: 'sep-colon', type: 'separator', label: 'Dos Puntos (:)', value: ':' },
  { id: 'sep-space', type: 'separator', label: 'Espacio ( )', value: ' ' },
  { id: 'sep-slash', type: 'separator', label: 'Barra (/)', value: '/' },
];

export const DUMMY_DATA: Record<string, string> = {
  tagCable: 'VBCON4-0101',
  tagName: 'G106-X1A',
  desde: 'SSA',
  bornera1: 'G106',
  borne1: 'L1',
  hacia: 'BMS',
  bornera2: '2X3',
  borne2: '1'
};

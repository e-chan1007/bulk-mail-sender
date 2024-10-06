export type Placeholder = {
  id: number;
  label: string;
}

export const placeholderPattern = /<#PLACEHOLDER\|(\d+?)>/g;
export const createPlaceholder = (column: number) => `<#PLACEHOLDER|${column}>`;

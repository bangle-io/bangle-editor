import type { BangleEditor } from '@bangle.dev/core';

export interface EditorInfo {
  bangleEditor?: BangleEditor;
  id: keyof EditorInfos;
  mount: boolean;
}

export const EDITOR_1 = 'EDITOR_1';
export const EDITOR_2 = 'EDITOR_2';
export const EDITOR_3 = 'EDITOR_3';
export const EDITOR_4 = 'EDITOR_4';

export const allEditorIds: EditorId[] = [
  EDITOR_1,
  EDITOR_2,
  EDITOR_3,
  EDITOR_4,
];

export type EditorId =
  | typeof EDITOR_1
  | typeof EDITOR_2
  | typeof EDITOR_3
  | typeof EDITOR_4;

export interface EditorInfos {
  [EDITOR_1]: EditorInfo;
  [EDITOR_2]: EditorInfo;
  [EDITOR_3]: EditorInfo;
  [EDITOR_4]: EditorInfo;
}

export interface TestConfig {
  initialEditors: EditorId[];
}

export const baseTestConfig: TestConfig = {
  initialEditors: [EDITOR_1, EDITOR_2, EDITOR_3, EDITOR_4],
};

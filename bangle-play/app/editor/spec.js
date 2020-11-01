import { coreMarkSpec } from 'bangle-core/marks/index';
import { coreNodeSpec } from 'bangle-core/nodes/index';

export const editorSpec = [...coreNodeSpec(), ...coreMarkSpec()];

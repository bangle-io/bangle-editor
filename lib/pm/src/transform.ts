export {
  AddMarkStep,
  MapResult,
  Mapping,
  RemoveMarkStep,
  ReplaceAroundStep,
  ReplaceStep,
  Step,
  StepMap,
  StepResult,
  Transform,
  // TODO fix typing as it exists
  // TransformError,
  canJoin,
  canSplit,
  dropPoint,
  findWrapping,
  insertPoint,
  joinPoint,
  liftTarget,
  replaceStep,
} from 'prosemirror-transform';

export type { Mappable } from 'prosemirror-transform';

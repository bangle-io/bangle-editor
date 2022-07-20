import { CollabFail } from '@bangle.dev/collab-comms';
import type { Node, Step, StepMap, StepResult } from '@bangle.dev/pm';
import { Either, EitherType, isTestEnv } from '@bangle.dev/utils';

export interface StepBigger extends Step {
  clientID: string;
}

export const MAX_STEP_HISTORY = 1000;

const LOG = true;

let log = (isTestEnv ? false : LOG)
  ? console.debug.bind(console, 'collab-server/state:')
  : () => {};

export class CollabServerState {
  static addEvents(
    state: CollabServerState,
    version: number,
    steps: Step[],
    clientID: string,
  ): EitherType<CollabFail, CollabServerState> {
    if (CollabServerState.isInvalidVersion(state, version)) {
      return Either.left(CollabFail.InvalidVersion);
    }

    const biggerSteps: StepBigger[] = steps.map((s) =>
      Object.assign(s, { clientID }),
    );

    if (state.version !== version) {
      return Either.left(CollabFail.OutdatedVersion);
    }

    let newDoc = state.doc;
    const maps: StepMap[] = [];

    for (const step of biggerSteps) {
      let result: StepResult | undefined;

      try {
        result = step.apply(newDoc);
      } catch (error) {
        console.error(error);
        return Either.left(CollabFail.ApplyFailed);
      }

      if (result.doc == null) {
        return Either.left(CollabFail.ApplyFailed);
      }

      newDoc = result.doc;
      maps.push(step.getMap());
    }

    const newVersion = state.version + biggerSteps.length;
    const newSteps = state.steps.concat(biggerSteps);
    log(`${clientID}: addEvents version=${newVersion}`);

    return Either.right(new CollabServerState(newDoc, newSteps, newVersion));
  }

  static getEvents(
    collabState: CollabServerState,
    version: number,
  ): EitherType<CollabFail, { version: number; steps: StepBigger[] }> {
    if (CollabServerState.isInvalidVersion(collabState, version)) {
      return Either.left(CollabFail.InvalidVersion);
    }

    let startIndex = collabState.steps.length - (collabState.version - version);

    if (startIndex < 0) {
      return Either.left(CollabFail.HistoryNotAvailable);
    }

    return Either.right({
      version: collabState.version,
      steps: collabState.steps.slice(startIndex),
    });
  }

  static isInvalidVersion(collabState: CollabServerState, version: number) {
    return version < 0 || version > collabState.version;
  }

  constructor(
    public readonly doc: Node,
    public readonly steps: StepBigger[] = [],
    public readonly version: number = 0,
  ) {
    // Trim steps if needed
    if (steps.length > MAX_STEP_HISTORY) {
      this.steps = steps.slice(steps.length - MAX_STEP_HISTORY);
    }
  }
}

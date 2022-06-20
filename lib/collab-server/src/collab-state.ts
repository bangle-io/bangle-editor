import type { Node, Step, StepMap } from '@bangle.dev/pm';

import {
  COLLAB_STATUS_FAIL,
  COLLAB_STATUS_OK,
  CollabFail,
} from './collab-error';

export interface StepBigger extends Step {
  clientID: string;
}

export const MAX_STEP_HISTORY = 1000;

export class CollabState {
  static addEvents(
    collabState: CollabState,
    version: number,
    steps: Step[],
    clientID: string,
  ) {
    if (CollabState.isInvalidVersion(collabState, version)) {
      return {
        status: COLLAB_STATUS_FAIL,
        reason: CollabFail.InvalidVersion,
      };
    }

    const biggerSteps: StepBigger[] = steps.map((s) =>
      Object.assign(s, { clientID }),
    );

    if (collabState.version !== version) {
      return {
        status: COLLAB_STATUS_FAIL,
        reason: CollabFail.OutdatedVersion,
      };
    }

    let newDoc = collabState.doc;
    const maps: StepMap[] = [];

    for (const step of biggerSteps) {
      let result = step.apply(newDoc);
      if (result.doc == null) {
        return {
          status: COLLAB_STATUS_FAIL,
          reason: CollabFail.ApplyFailed,
        };
      }

      newDoc = result.doc;
      maps.push(step.getMap());
    }

    const newVersion = collabState.version + biggerSteps.length;
    const newSteps = collabState.steps.concat(biggerSteps);

    return {
      status: COLLAB_STATUS_OK,
      collabState: new CollabState(newDoc, newSteps, newVersion),
    };
  }

  static getEvents(collabState: CollabState, version: number) {
    if (CollabState.isInvalidVersion(collabState, version)) {
      return {
        status: COLLAB_STATUS_FAIL,
        reason: CollabFail.InvalidVersion,
      };
    }

    let startIndex = collabState.steps.length - (collabState.version - version);

    if (startIndex < 0) {
      return {
        status: COLLAB_STATUS_FAIL,
        reason: CollabFail.HistoryNotAvailable,
      };
    }

    return {
      status: COLLAB_STATUS_OK,
      steps: collabState.steps.slice(startIndex),
    };
  }

  static isInvalidVersion(collabState: CollabState, version: number) {
    return version < 0 || version > collabState.version;
  }

  constructor(
    public readonly doc: Node,
    public readonly steps: StepBigger[],
    public readonly version: number,
  ) {
    // Trim steps if needed
    if (steps.length > MAX_STEP_HISTORY) {
      this.steps = steps.slice(steps.length - MAX_STEP_HISTORY);
    }
  }
}

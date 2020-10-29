import { Plugin } from 'prosemirror-state';
import { isMarkActiveInSelection } from 'bangle-core/utils/pm-utils';

import { doesQueryHaveTrigger } from './helpers';
import { removeTypeAheadMarkCmd } from './commands';
import {
  hideTooltip,
  showTooltip,
} from 'bangle-plugins/tooltip-placement/index';

const LOG = true;
let log = LOG
  ? console.log.bind(console, 'plugins/inline-tooltipActivatePlugin')
  : () => {};

/**
 * This plugin syncs the state between tooltip's show and trigger mark.
 * For example,
 * - if trigger mark is no longer active, it hides the tooltip.
 * - if it becomes active, it brings back the tooltip.
 * - if already active and mark position changed, it updates the tooltips position.
 * Because of this plugin, other plugins can derive their state just based on the tooltip's show state
 * @param {*} param0
 */
export function tooltipController({
  trigger,
  showTooltip,
  hideTooltip,
  markName,
}) {
  return new Plugin({
    view() {
      return {
        update: (view, lastState) => {
          const { state } = view;

          if (lastState === state || !state.selection.empty) {
            return;
          }
          const markType = state.schema.marks[markName];
          if (
            lastState.doc.eq(state.doc) &&
            state.selection.eq(lastState && lastState.selection) &&
            // This is a shorthand for checking if the stored mark  of `markType`
            // has changed within the last step. If it has we need to update the state
            isMarkStoredMark(state, markType) ===
              isMarkStoredMark(lastState, markType)
          ) {
            return;
          }

          const isMarkActive = isMarkActiveInSelection(markType)(state);

          // remove the mark if the user delete the trigger but remaining query
          // stayed. example `<mark>/hello</mark>` --(user deletes the /)-> `<mark>hello</mark>`
          if (isMarkActive && !doesQueryHaveTrigger(state, markType, trigger)) {
            removeTypeAheadMarkCmd(markType)(state, view.dispatch, view);
            return;
          }

          if (!isMarkActive) {
            hideTooltip(state, view.dispatch, view);
            return;
          }

          showTooltip(state, view.dispatch, view);
          return;
        },
      };
    },
  });
}

function isMarkStoredMark(state, markType) {
  return state && state.storedMarks && markType.isInSet(state.storedMarks);
}

import { Plugin } from 'prosemirror-state';
import { isMarkActiveInSelection } from 'bangle-core/utils/pm-utils';

import { doesQueryHaveTrigger } from './helpers';
import {
  hideTooltipCommand,
  showTooltipCommand,
  removeTypeAheadMarkCmd,
} from './commands';

const LOG = false;
let log = LOG
  ? console.log.bind(console, 'plugins/inline-tooltipActivatePlugin')
  : () => {};

/**
 * This plugin syncs the state between tooltip's show and trigger mark.
 * For example,
 * if trigger mark is no longer active, it hides the tooltip.
 * if it becomes active, it brings back the tooltip.
 * if already active and mark position changed, it updates the tooltips position.
 * Because of this plugin, other plugins can derive their on state just based on tooltip's show state
 * @param {*} param0
 */
export function tooltipActivatePlugin({ trigger, tooltipPluginKey, markName }) {
  return new Plugin({
    view(view) {
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

          const isMarkActive = isMarkActiveInSelection(
            state,
            state.schema.marks[markName],
          );

          // remove the mark if the user delete the trigger but remaining query
          // stayed. example `<mark>/hello</mark>` --(user deletes)-> `<mark>hello</mark>`
          if (isMarkActive && !doesQueryHaveTrigger(state, markType, trigger)) {
            removeTypeAheadMarkCmd(markName)(state, view.dispatch);
            return;
          }

          if (!isMarkActive) {
            hideTooltipCommand(tooltipPluginKey)(state, view.dispatch);
            return;
          }

          showTooltipCommand(tooltipPluginKey)(state, view.dispatch);
          return;
        },
      };
    },
  });
}

function isMarkStoredMark(state, markType) {
  return state && state.storedMarks && markType.isInSet(state.storedMarks);
}

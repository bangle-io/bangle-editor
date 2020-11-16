import React from 'react';
import { Plugin, PluginKey } from 'prosemirror-state';
import {
  showTooltip,
  hideTooltip,
  tooltipPlacement,
} from 'bangle-plugins/tooltip-placement/index';
import { pluginKeyStore } from 'bangle-plugins/helpers/utils';
import { valuePlugin } from 'bangle-core/utils/pm-utils';
import { DOMSerializer } from 'prosemirror-model';

export const plugins = pluginsFactory;
export const commands = {};

const keyStore = pluginKeyStore();
const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

const getTooltipKey = (parentKey) => {
  return keyStore.get(parentKey, parentKey.key + '__tooltip');
};
const createTooltipKey = (parentKey) => {
  return keyStore.create(parentKey, parentKey.key + '__tooltip');
};

const defaultTooltipOpts = {};

function pluginsFactory({
  key = new PluginKey('floatingMenu'),
  shouldShowTooltip = (pluginState, state) => {
    return !state.selection.empty;
  },
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
} = {}) {
  const tooltipKey = createTooltipKey(key);
  const { tooltipContentDOM, tooltipDOM } = createTooltipDOM();
  return [
    valuePlugin(key, { tooltipContentDOM, tooltipKey }),
    tooltipPlacement.plugins({
      key: tooltipKey,
      tooltipDOM,
      // TODO get rid of this pluginName
      pluginName: 'menuTooltip',
      tooltipOffset: () => {
        return [0, 0.5 * rem];
      },
      getReferenceElement: getSelectionReferenceElement,
      getInitialShowState: (state) => shouldShowTooltip(null, state),
      getScrollContainerDOM,
      ...defaultTooltipOpts,
    }),
    new Plugin({
      view() {
        return {
          update: (view, lastState) => {
            let state = view.state;
            if (
              lastState &&
              lastState.doc.eq(state.doc) &&
              lastState.selection.eq(state.selection)
            ) {
              return;
            }
            const tooltipPluginState = tooltipKey.getState(state);
            const shouldShow = shouldShowTooltip(tooltipPluginState, state);

            if (shouldShow) {
              // Keep showing it, even if it is true, so that tooltip
              // positions can be updated.
              showTooltip(tooltipKey)(view.state, view.dispatch, view);
              return;
            }

            if (tooltipPluginState.show === true) {
              hideTooltip(tooltipKey)(view.state, view.dispatch, view);
              return;
            }
          },
        };
      },
    }),
  ];
}

function getSelectionReferenceElement(view) {
  return {
    getBoundingClientRect: () => {
      let { head } = view.state.selection;

      const start = view.coordsAtPos(head);
      let { top, bottom, left, right } = start;

      return {
        width: right - left,
        height: bottom - top,
        top: top,
        right: right,
        bottom: bottom,
        left: left,
      };
    },
  };
}

function createTooltipDOM(arrow = false) {
  const {
    dom: tooltipDOM,
    contentDOM: tooltipContentDOM,
  } = DOMSerializer.renderSpec(
    window.document,
    [
      'div',
      {
        class: 'bangle-tooltip bangle-selection-tooltip',
        role: 'tooltip',
      },
      [
        'div',
        {
          class: 'bangle-tooltip-content',
        },
        0,
      ],
      arrow && [
        'div',
        {
          'class': 'bangle-tooltip-arrow',
          'data-popper-arrow': '',
        },
      ],
    ].filter(Boolean),
  );

  return { tooltipDOM, tooltipContentDOM };
}

export class InlineMenu extends React.PureComponent {
  constructor(props) {}

  render() {
    return <div></div>;
  }
}

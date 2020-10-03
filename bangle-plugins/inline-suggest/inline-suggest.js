import { Mark } from 'bangle-core/marks';
import { findFirstMarkPosition, filter } from 'bangle-core/utils/pm-utils';

import { tooltipPlacementPlugin } from '../tooltip-placement/index';
import { tooltipActivatePlugin } from './tooltip-activate-plugin';
import { triggerInputRule } from './trigger-input-rule';
import { Plugin } from 'prosemirror-state';
import { getQueryText } from './helpers';
import { removeTypeAheadMarkCmd } from './commands';

const LOG = true;
let log = LOG ? console.log.bind(console, 'plugins/inline-command') : () => {};

// TODO make it throw error if there exists another one with the same trigger
export class InlineSuggest extends Mark {
  get name() {
    return 'inline_suggest_c' + this.options.trigger.charCodeAt(0);
  }
  get schema() {
    return {
      name: this.name,
      inclusive: true,
      group: 'triggerMarks',
      parseDOM: [{ tag: 'span[data-inline-command]' }],
      toDOM(node) {
        return [
          'span',
          {
            'data-inline-command': 'true',
            'data-trigger': node.attrs.trigger,
            'style': `color: #0052CC`,
          },
        ];
      },
      attrs: {
        trigger: { default: '' },
      },
    };
  }
  // we need to expose this for folks to programatically control this
  get tooltipPluginKey() {
    return this._tooltipPluginKey;
  }

  get defaultOptions() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const setTooltipContent = (content) => {
      const child = this.options.tooltipDOM.querySelector(
        '.bangle-tooltip-content',
      );
      if (child) {
        child.innerText = content.padEnd(5, '.');
      }
    };
    return {
      trigger: '/',
      tooltipDOM: createTooltipDOM(),
      placement: 'bottom-start',
      getScrollContainerDOM: (view) => {
        return view.dom.parentElement;
      },
      tooltipOffset: (view) => {
        return [0, 0.4 * rem];
      },
      onUpdate: ({ queryText }) => {
        setTooltipContent(this.options.trigger + ':' + queryText);
        log(this.name, 'update called');
      },
      onDestroy: () => {
        log(this.name, 'destroy called');
      },
      onEnter: () => {
        log('herere');
        return true;
      },
      onArrowDown: () => {
        log('arrow down');
        setTooltipContent('down');
        return true;
      },
      onArrowUp: () => {
        log('arrow up');
        setTooltipContent('up');
        return true;
      },
    };
  }

  inputRules({ schema }) {
    return [triggerInputRule(schema, this.name, this.options.trigger)];
  }

  get plugins() {
    const { plugin, key: tooltipPluginKey } = tooltipPlacementPlugin({
      pluginName: this.name + 'Tooltip',
      placement: this.options.placement,
      tooltipOffset: this.options.tooltipOffset,
      tooltipDOM: this.options.tooltipDOM,
      getScrollContainerDOM: this.options.getScrollContainerDOM,
      getReferenceElement: triggerReferenceElement(
        (schema) => schema.marks[this.name],
        (state, markType) => {
          const { selection } = state;
          return findFirstMarkPosition(
            markType,
            state.doc,
            selection.from - 1,
            selection.to,
          );
        },
      ),
      showTooltipArrow: false,
    });

    this._tooltipPluginKey = tooltipPluginKey;

    const { trigger, tooltipDOM, onUpdate, onDestroy } = this.options;
    const markName = this.name;
    return [
      plugin,
      tooltipActivatePlugin({
        trigger,
        tooltipDOM: tooltipDOM,
        tooltipPluginKey,
        markName,
      }),
      new Plugin({
        view() {
          return {
            update(view, lastState) {
              const { state } = view;
              if (lastState === state || !state.selection.empty) {
                return;
              }
              const tooltipState = tooltipPluginKey.getState(state);
              const lastTooltipState = tooltipPluginKey.getState(lastState);

              if (tooltipState === lastTooltipState) {
                return;
              }

              if (tooltipState.show) {
                const markType = state.schema.marks[markName];
                const queryText = getQueryText(view.state, markType, trigger);
                onUpdate({ queryText, markType });
                return;
              }

              if (
                tooltipState.show === false &&
                lastTooltipState.show !== false
              ) {
                // TODO why is destroy called twice
                onDestroy();
                return;
              }
            },
          };
        },
      }),
    ];
  }

  keys() {
    const markName = this.name;
    const isActiveCheck = (state) =>
      this.tooltipPluginKey && this.tooltipPluginKey.getState(state).show;
    return {
      Enter: filter(
        [isActiveCheck, (state) => this.options.onEnter({ state })],
        removeTypeAheadMarkCmd(markName),
      ),
      ArrowUp: filter(isActiveCheck, (state) =>
        this.options.onArrowUp({ state }),
      ),
      ArrowDown: filter(isActiveCheck, (state) =>
        this.options.onArrowDown({ state }),
      ),
    };
  }
}

export function createTooltipDOM() {
  const tooltip = document.createElement('div');
  tooltip.id = 'bangle-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  // const tooltipArrow = document.createElement('div');
  // tooltipArrow.id = 'bangle-tooltip-arrow';
  // tooltipArrow.setAttribute('data-popper-arrow', true);
  // tooltip.appendChild(tooltipArrow);
  const tooltipContent = document.createElement('div');
  tooltipContent.className = 'bangle-tooltip-content';
  tooltipContent.textContent = 'hello world';
  tooltip.appendChild(tooltipContent);
  return tooltip;
}

export function triggerReferenceElement(getMarkType, getActiveMarkPos) {
  return (view, tooltipDOM, scrollContainerDOM) => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const markType = getMarkType(view.state.schema);
    return {
      getBoundingClientRect: () => {
        let state = view.state;
        const markPos = getActiveMarkPos(state, markType);

        // add by + so that we get the position right after trigger
        const startPos = markPos.start > -1 ? markPos.start + 1 : 0;
        const start = view.coordsAtPos(startPos);
        // if the query spanned two lines, we want to show the tooltip based on the end pos
        // so that it doesn't hide the query
        const end = view.coordsAtPos(markPos.end > -1 ? markPos.end : startPos);

        let { left, right } = start;
        let { top, bottom } = end;
        const scrollContainersRect = scrollContainerDOM.getBoundingClientRect();

        // if we bleed outside the scroll container, pull it back
        // so its inside. There seems to be a bug where multiple scroll bars show up, to
        // cover that up we are dong this.
        if (scrollContainersRect.bottom - bottom < 0) {
          const tooltipRect = tooltipDOM.getBoundingClientRect();
          // added 1 rem to offset the fact that it will be dealt tooltipOffset
          // which adds an offset pushing the tooltip to go out of viewport
          let height = tooltipRect.height + 1 * rem;
          top = scrollContainersRect.bottom - 2 * height;
          bottom = scrollContainersRect.bottom - 1 * height;
          right = left;
        }

        return {
          width: right - left,
          height: bottom - top,
          top: top,
          right: left,
          bottom: bottom,
          left: left,
        };
      },
    };
  };
}

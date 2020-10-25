import { Mark } from 'bangle-core/marks/index';
import { findFirstMarkPosition, filter } from 'bangle-core/utils/pm-utils';

import {
  hideTooltip,
  showTooltip,
  tooltipPlacementPlugin,
} from '../tooltip-placement/index';
import { tooltipController } from './tooltip-controller';
import { triggerInputRule } from './trigger-input-rule';
import { getQueryText } from './helpers';
import { removeTypeAheadMarkCmd } from './commands';

const LOG = true;
let log = LOG ? console.log.bind(console, 'plugins/inline-suggest') : () => {};

export class InlineSuggest extends Mark {
  get name() {
    return 'inline_suggest_c' + this.options.trigger.charCodeAt(0);
  }

  get schema() {
    return {
      name: this.name,
      inclusive: true,
      group: 'triggerMarks',
      parseDOM: [{ tag: `span[data-${this.name}]` }],
      toDOM: (node) => {
        return [
          'span',
          {
            [`data-${this.name}`]: 'true',
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

  get markdown() {
    // This essentially removes the mark
    return {
      toMarkdown: {
        open: '',
        close: '',
        mixable: true,
      },
    };
  }

  get defaultOptions() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const { tooltipDOM, tooltipContent } = createTooltipDOM();
    tooltipContent.textContent = 'hello world';
    return {
      trigger: '/',
      tooltipDOM,
      placement: 'bottom-start',
      enterKeyName: 'Enter',
      arrowUpKeyName: 'ArrowUp',
      arrowDownKeyName: 'ArrowDown',
      escapeKeyName: 'Escape',
      fallbackPlacements: undefined,
      // Use another key to mimic enter behaviour for example, Tab for entering
      alternateEnterKeyName: undefined,
      getScrollContainerDOM: (view) => {
        return view.dom.parentElement;
      },
      tooltipOffset: () => {
        return [0, 0.4 * rem];
      },
      onUpdateTooltip: (state, dispatch, view) => {},
      // No need to call removeTypeAheadMarkCmd on destroy
      onHideTooltip: (state, dispatch, view) => {},
      onEnter: (state, dispatch, view) => {
        return removeTypeAheadMarkCmd(this.getMarkType(state))(
          state,
          dispatch,
          view,
        );
      },
      onArrowDown: (state, dispatch, view) => {
        return true;
      },
      onArrowUp: (state, dispatch, view) => {
        return true;
      },
      onEscape: (state, dispatch, view) => {
        return removeTypeAheadMarkCmd(this.getMarkType(state))(
          state,
          dispatch,
          view,
        );
      },
    };
  }

  inputRules({ schema }) {
    return [triggerInputRule(schema, this.name, this.options.trigger)];
  }

  /**
   *
   * @param {*} maybeNode Node | string | Fragment
   * @param {*} opts
   */

  get plugins() {
    const plugin = tooltipPlacementPlugin({
      pluginName: this.name + 'Tooltip',
      placement: this.options.placement,
      fallbackPlacements: this.options.fallbackPlacements,
      tooltipOffset: this.options.tooltipOffset,
      tooltipDOM: this.options.tooltipDOM,
      getScrollContainerDOM: this.options.getScrollContainerDOM,
      getReferenceElement: triggerReferenceElement(
        (state) => this.getMarkType(state),
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
      onUpdateTooltip: this.options.onUpdateTooltip,
      onHideTooltip: this.options.onHideTooltip,
    });

    this._tooltipPlugin = plugin;

    const { trigger } = this.options;
    const markName = this.name;

    return [
      plugin,
      tooltipController({
        trigger,
        markName,
        showTooltip: showTooltip(plugin),
        hideTooltip: hideTooltip(plugin),
      }),
    ];
  }

  keys() {
    const isActiveCheck = (state) => this.isTooltipActive(state);

    const result = {
      [this.options.enterKeyName]: filter(isActiveCheck, this.options.onEnter),
      [this.options.arrowUpKeyName]: filter(
        isActiveCheck,
        this.options.onArrowUp,
      ),
      [this.options.arrowDownKeyName]: filter(
        isActiveCheck,
        this.options.onArrowDown,
      ),
      [this.options.escapeKeyName]: filter(
        isActiveCheck,
        this.options.onEscape,
      ),
    };
    if (this.options.alternateEnterKeyName) {
      result[this.options.alternateEnterKeyName] =
        result[this.options.enterKeyName];
    }
    return result;
  }

  /**
   * Public API
   */

  getMarkName() {
    return this.name;
  }

  getMarkType(state) {
    return state.schema.marks[this.name];
  }

  getQueryText(state) {
    const markType = this.getMarkType(state);
    return getQueryText(state, markType, this.options.trigger);
  }

  isTooltipActive(state) {
    return this._tooltipPlugin && this._tooltipPlugin.getState(state)?.show;
  }

  getTooltipPlugin() {
    return this._tooltipPlugin;
  }
}

export function createTooltipDOM(className = 'bangle-tooltip') {
  const tooltipDOM = document.createElement('div');
  tooltipDOM.className = className;
  tooltipDOM.setAttribute('role', 'tooltip');
  const tooltipContent = document.createElement('div');
  tooltipContent.className = className + '-content';
  tooltipDOM.appendChild(tooltipContent);
  return { tooltipDOM, tooltipContent };
}

export function triggerReferenceElement(getMarkType, getActiveMarkPos) {
  return (view, tooltipDOM, scrollContainerDOM) => {
    const markType = getMarkType(view.state);
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

        let z = {
          width: right - left,
          height: bottom - top,
          top: top,
          right: left,
          bottom: bottom,
          left: left,
        };

        return z;
      },
    };
  };
}

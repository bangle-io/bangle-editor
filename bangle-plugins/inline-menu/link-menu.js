import React, { useRef, useState } from 'react';
import { keymap } from 'prosemirror-keymap';
import reactDOM from 'react-dom';
import { filter } from 'bangle-core/utils/pm-utils';
import {
  isSelectionAroundLink,
  isSelectionInsideLink,
  setLinkAtSelection,
  getLinkMarkDetails,
  canLinkBeCreatedInRange,
} from 'bangle-core/components/link';
import { uuid } from 'bangle-core/utils/js-utils';
import { Icon } from './icon-helpers';
import { Plugin, PluginKey } from 'prosemirror-state';
import { pluginKeyStore } from 'bangle-plugins/helpers/utils';
import { selectionTooltip } from '../selection-tooltip/index';
import { hideAllSelectionTooltip } from 'bangle-plugins/selection-tooltip/selection-tooltip';

export const plugins = pluginsFactory;
export const commands = {
  hideLinkMenu,
  showLinkMenu,
  isLinkMenuActive,
  focusLinkMenu,
  showLinkTooltip,
};

const name = 'link_menu';

const keyStore = pluginKeyStore();

const getTooltipKey = (parentKey) => {
  return keyStore.get(parentKey, parentKey.key + '__selectionTooltip');
};
const createTooltipKey = (parentKey) => {
  return keyStore.create(parentKey, parentKey.key + '__selectionTooltip');
};

function pluginsFactory({
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
  key = new PluginKey('linkMenu'),
} = {}) {
  const { tooltipDOM, tooltipContent } = selectionTooltip.createTooltipDOM();
  const tooltipKey = createTooltipKey(key);
  const getIsTop = () => {
    return tooltipDOM.getAttribute('data-popper-placement') === 'top';
  };

  const inputId = 'bangle-link-menu' + uuid();
  const setFocus = () => {
    const el = document.getElementById(inputId);
    if (el) {
      el.focus();
    }
  };

  const render = (state, dispatch, view) => {
    const result = getLinkMarkDetails(state);
    reactDOM.render(
      <Component
        result={result}
        view={view}
        inputId={inputId}
        getIsTop={getIsTop}
      />,
      tooltipContent,
    );

    return true;
  };

  const selectionPlugins = selectionTooltip.plugins({
    key: tooltipKey,
    tooltipName: name + '_tooltip',
    tooltipDOM,
    getScrollContainerDOM,
    placement: 'top',

    shouldShowTooltip: filter(
      (state) => {
        return isSelectionAroundLink(state) || isSelectionInsideLink(state);
      },
      () => {
        return true;
      },
    ),

    onHideTooltip: () => {
      reactDOM.unmountComponentAtNode(tooltipContent);
      return true;
    },

    onUpdateTooltip: (state, dispatch, view) => {
      return render(state, dispatch, view);
    },

    onArrowDown: (state, dispatch, view) => {
      if (!view.hasFocus()) {
        return false;
      }
      if (getIsTop()) {
        return false;
      }
      setFocus();
      return true;
    },

    onArrowUp: (state, dispatch, view) => {
      if (!view.hasFocus()) {
        return false;
      }
      if (!getIsTop()) {
        return false;
      }
      setFocus();
      return true;
    },
  });

  const linkMenuStatePlugin = new Plugin({
    key: key,
    state: {
      init: (_, state) => {
        return null;
      },
      apply: (tr, pluginState) => {
        const payload = tr.getMeta(key);
        if (!payload) {
          return pluginState;
        }
        if (payload.type === 'focus') {
          setFocus();
        }
        return pluginState;
      },
    },
  });

  return [
    linkMenuStatePlugin,
    selectionPlugins,
    keymap({
      'Meta-k': (state, dispatch, view) => {
        const isActive = selectionTooltip.isSelectionTooltipActive(tooltipKey)(
          state,
        );
        if (view.hasFocus() && isActive) {
          return setFocus();
        }
        if (!state.selection.empty) {
          hideAllSelectionTooltip()(state, dispatch, view);
          showLinkTooltip(key)(view.state, view.dispatch, view);
          return true;
        }
        return false;
      },
    }),
  ];
}

function Component({ result, view, inputId, getIsTop }) {
  const originalHref = result?.href || '';
  const [href, setHref] = useState(originalHref);
  const inputRef = useRef();
  const handleSubmit = (e) => {
    e.preventDefault();
    setLinkAtSelection(href)(view.state, view.dispatch);
    view.focus();
  };

  return (
    <span className="bangle-link-menu">
      <input
        id={inputId}
        value={href}
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSubmit(e);
            view.focus();
            return;
          }
          const isTop = getIsTop();
          if (isTop && e.key === 'ArrowDown') {
            e.preventDefault();
            view.focus();
            return;
          }
          if (!isTop && e.key === 'ArrowUp') {
            e.preventDefault();
            view.focus();
            return;
          }

          if (e.key === 'Escape') {
            e.preventDefault();
            view.focus();
            return;
          }
        }}
        onChange={(e) => {
          setHref(e.target.value);
          e.preventDefault();
        }}
      />
      <a href={href} target="_blank" rel="noreferrer">
        <ExternalIcon />
      </a>
      {href === originalHref ? (
        <CloseIcon
          onClick={() => {
            setLinkAtSelection()(view.state, view.dispatch);
            view.focus();
          }}
        />
      ) : (
        <DoneIcon
          onClick={(e) => {
            handleSubmit(e);
            view.focus();
          }}
        />
      )}
    </span>
  );
}
const CloseIcon = (props) => {
  return (
    <Icon {...props}>
      <path d="M16.34 9.32a1 1 0 10-1.36-1.46l-2.93 2.73-2.73-2.93a1 1 0 00-1.46 1.36l2.73 2.93-2.93 2.73a1 1 0 101.36 1.46l2.93-2.73 2.73 2.93a1 1 0 101.46-1.36l-2.73-2.93 2.93-2.73z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12a11 11 0 1122 0 11 11 0 01-22 0zm11 9a9 9 0 110-18 9 9 0 010 18z"
      />
    </Icon>
  );
};
const DoneIcon = (props) => {
  return (
    <Icon {...props}>
      <path d="M10.2426 16.3137L6 12.071L7.41421 10.6568L10.2426 13.4853L15.8995 7.8284L17.3137 9.24262L10.2426 16.3137Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
      />
    </Icon>
  );
};

const ExternalIcon = (props) => {
  return (
    <Icon {...props}>
      <path d="M15.6396 7.02527H12.0181V5.02527H19.0181V12.0253H17.0181V8.47528L12.1042 13.3892L10.6899 11.975L15.6396 7.02527Z" />
      <path d="M10.9819 6.97473H4.98193V18.9747H16.9819V12.9747H14.9819V16.9747H6.98193V8.97473H10.9819V6.97473Z" />
    </Icon>
  );
};

/**
 *  Commands
 */

export function hideLinkMenu(key) {
  return selectionTooltip.hideSelectionTooltip(getTooltipKey(key));
}

export function showLinkMenu(key) {
  return (state, dispatch, view) => {
    window.view = view;
    const result = selectionTooltip.showSelectionTooltip(getTooltipKey(key))(
      state,
      dispatch,
      view,
    );
    if (result && dispatch) {
      const tr = view.state.tr;
      dispatch(tr.setMeta(key, { type: 'focus' }));
    }

    return result;
  };
}

export function isLinkMenuActive(pluginKey) {
  return selectionTooltip.isSelectionTooltipActive(getTooltipKey(pluginKey));
}

export function focusLinkMenu(pluginKey) {
  return (state, dispatch) => {
    if (dispatch) {
      const tr = state.tr;
      dispatch(tr.setMeta(pluginKey, { type: 'focus' }));
    }
    return true;
  };
}

export function showLinkTooltip(key) {
  const tooltipKey = getTooltipKey(key);
  return filter(
    [
      (state) => !state.selection.empty,
      (state) =>
        canLinkBeCreatedInRange(
          state.selection.$from.pos,
          state.selection.$to.pos,
        )(state),
    ],
    (state, dispatch, view) => {
      const isActive = selectionTooltip.isSelectionTooltipActive(tooltipKey)(
        state,
      );
      if (isActive) {
        dispatch(state.tr.setMeta(key, { type: 'focus' }));
        return true;
      }

      let result = selectionTooltip.showSelectionTooltip(tooltipKey)(
        state,
        dispatch,
        view,
      );
      if (result) {
        dispatch(view.state.tr.setMeta(key, { type: 'focus' }));
        return true;
      }
      return false;
    },
  );
}

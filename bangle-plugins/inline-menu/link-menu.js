import React, { useRef, useState } from 'react';

import {
  SelectionTooltip,
  createTooltipDOM,
} from 'bangle-plugins/selection-tooltip/index';
import reactDOM from 'react-dom';
import { filter } from 'bangle-core/utils/pm-utils';
import {
  isSelectionAroundLink,
  isSelectionInsideLink,
  setLinkAtSelection,
  getLinkMarkDetails,
} from 'bangle-core/marks/link';
import { uuid } from 'bangle-core/utils/js-utils';

export function LinkMenu({
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
} = {}) {
  const { tooltipDOM, tooltipContent } = createTooltipDOM();

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
      result && (
        <Component
          result={result}
          view={view}
          inputId={inputId}
          getIsTop={getIsTop}
        />
      ),
      tooltipContent,
    );

    return true;
  };

  const inlineSuggest = new SelectionTooltip({
    tooltipName: 'inline_mark_tooltip',
    tooltipDOM,
    getScrollContainerDOM,
    placement: 'top',

    shouldShowTooltip: filter(
      (state) => isSelectionAroundLink(state) || isSelectionInsideLink(state),
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

  return inlineSuggest;
}

function Component({ result, view, inputId, getIsTop }) {
  const inputRef = useRef(null);
  const originalHref = result?.href || '';
  const [href, setHref] = useState(originalHref);
  const handleSubmit = (e) => {
    e.preventDefault();
    setLinkAtSelection(href)(view.state, view.dispatch);
    view.focus();
  };

  return (
    <span
      style={{
        display: 'flex',
        flexDirection: 'row',
        padding: '4px 2px',
        alignItems: 'center',
      }}
    >
      <span>
        <input
          id={inputId}
          style={{ backgroundColor: 'transparent' }}
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
      </span>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{
          marginLeft: 5,
        }}
      >
        <ExternalIcon style={{ width: 18, height: 18 }} />
      </a>

      {href === originalHref ? (
        <span
          style={{
            cursor: 'pointer',
            marginLeft: 5,
          }}
          onClick={() => {
            setLinkAtSelection()(view.state, view.dispatch);
            view.focus();
          }}
        >
          <CloseIcon style={{ width: 16, height: 16 }} />
        </span>
      ) : (
        <span
          style={{
            cursor: 'pointer',
            marginLeft: 5,
          }}
          onClick={(e) => {
            handleSubmit(e);
            view.focus();
          }}
        >
          <DoneIcon style={{ width: 16, height: 16 }} />
        </span>
      )}
    </span>
  );
}
const CloseIcon = (props) => {
  return (
    <Svg {...props}>
      <path d="M16.34 9.32a1 1 0 10-1.36-1.46l-2.93 2.73-2.73-2.93a1 1 0 00-1.46 1.36l2.73 2.93-2.93 2.73a1 1 0 101.36 1.46l2.93-2.73 2.73 2.93a1 1 0 101.46-1.36l-2.73-2.93 2.93-2.73z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12a11 11 0 1122 0 11 11 0 01-22 0zm11 9a9 9 0 110-18 9 9 0 010 18z"
      />
    </Svg>
  );
};
const DoneIcon = (props) => {
  return (
    <Svg {...props}>
      <path d="M10.2426 16.3137L6 12.071L7.41421 10.6568L10.2426 13.4853L15.8995 7.8284L17.3137 9.24262L10.2426 16.3137Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
      />
    </Svg>
  );
};

const ExternalIcon = (props) => {
  return (
    <Svg {...props}>
      <path d="M15.6396 7.02527H12.0181V5.02527H19.0181V12.0253H17.0181V8.47528L12.1042 13.3892L10.6899 11.975L15.6396 7.02527Z" />
      <path d="M10.9819 6.97473H4.98193V18.9747H16.9819V12.9747H14.9819V16.9747H6.98193V8.97473H10.9819V6.97473Z" />
    </Svg>
  );
};

const Svg = ({ children, style = {}, size, className = '' }) => (
  <svg
    style={style}
    viewBox={'0 0 24 24'}
    xmlns="http://www.w3.org/2000/svg"
    className={`fill-current ${size ? `h-${size} w-${size}` : ''} ${className}`}
  >
    {children}
  </svg>
);

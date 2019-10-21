import { Plugin } from 'prosemirror-state';
import ReactDOM from 'react-dom';
import React from 'react';

/**
 *  <Wrapper>
 *      <ChildComponent editorView={editorView} {...props} />
 *      <PM-editor/>
 *  </Wrapper>
 * A simple wrapper around the PM plugin api which wraps the
 * PM editor's dom with a new div element. Places `ChildComponent`
 * a sibling above `pm-editor`. Also, manages the lifecycle for you
 */
export function reactPluginUIWrapper(
  { wrapperClass = 'wrapper', childClass = 'plugin-wrapper', props = {} },
  ChildComponent,
) {
  const view = (editorView) => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', wrapperClass);

    // make wrapper the wrapper for prosemirror dom content too
    editorView.dom.parentNode.replaceChild(wrapper, editorView.dom);
    const target = wrapper.appendChild(document.createElement('div'));
    target.setAttribute('class', childClass);
    wrapper.appendChild(editorView.dom);

    ReactDOM.render(
      <ChildComponent editorView={editorView} {...props} />,
      target,
    );

    return {
      update(editorView) {
        ReactDOM.render(
          <ChildComponent editorView={editorView} {...props} />,
          target,
        );
      },
      destroy() {
        if (wrapper.parentNode) {
          wrapper.parentNode.replaceChild(editorView.dom, this.wrapper);
        }
        if (target.parentNode) {
          ReactDOM.unmountComponentAtNode(target);
        }
      },
    };
  };

  return new Plugin({
    view,
  });
}

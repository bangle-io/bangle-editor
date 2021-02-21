import '@bangle.dev/core/style.css';
import { BangleEditor, BangleEditorState } from '@bangle.dev/core';
import * as pmCommands from '@bangle.dev/core/prosemirror/commands';
import * as pmInputRules from '@bangle.dev/core/prosemirror/inputrules';
import * as pmModel from '@bangle.dev/core/prosemirror/model';
import * as pmState from '@bangle.dev/core/prosemirror/state';
import * as pmTransform from '@bangle.dev/core/prosemirror/transform';
import * as pmView from '@bangle.dev/core/prosemirror/view';
import { collapsibleHeading } from '@bangle.dev/collapsible';

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specs: [collapsibleHeading.spec()],
    plugins: [collapsibleHeading.plugins()],
    initialValue: `<div>
    <h1>Hi folks</h1>
    <p>Hello there, let us see some <sup>superscript</sup> & <sub>subscript</sub>!</p>
    </div>`,
  });

  const editor = new BangleEditor(domNode, { state });
  window.editor = editor;
  const { view } = editor;
  // set selection at end to demo the example
  return editor;
}

window.pmCommands = pmCommands;
window.pmInputRules = pmInputRules;
window.pmModel = pmModel;
window.pmState = pmState;
window.pmTransform = pmTransform;
window.pmView = pmView;

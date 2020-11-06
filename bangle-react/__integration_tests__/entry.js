import './entry.css';
import { BangleEditor } from 'bangle-core/editor';
import { corePlugins, coreSpec } from 'bangle-core/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { dinos2 } from 'bangle-react/components/index';

console.debug('Bangle-react entry.js');

function setup() {
  const element = document.createElement('div');
  window.document.body.appendChild(element);
  element.setAttribute('id', 'root');
  const editorContainer = document.createElement('div');
  editorContainer.setAttribute('id', 'pm-root');
  element.appendChild(editorContainer);
  setupEditor(editorContainer);
}

function setupEditor(container) {
  const specSheet = new SpecSheet([...coreSpec(), dinos2.spec()]);
  const plugins = [...corePlugins(), dinos2.plugins()];
  window.editor = new BangleEditor(container, {
    specSheet,
    plugins,
  });
}

setup();

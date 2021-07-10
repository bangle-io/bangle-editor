import {
  BangleEditor,
  BangleEditorState,
  corePlugins,
  coreSpec,
  SpecRegistry,
} from '@bangle.dev/core';
import {
  listCollapsedHeading,
  listCollapsibleHeading,
  toggleHeadingCollapse,
} from '@bangle.dev/core/components/heading';
import '@bangle.dev/core/style.css';
import { Plugin, Selection } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specRegistry: new SpecRegistry(coreSpec()),
    plugins: () => [...corePlugins(), collapsePlugin],
    initialValue: `<div>
    <h2>Philosophy</h2>
    <p>Philosophy is the study of underlying things. This means philosophy tries to understand the reasons or basis for things. It also tries to understand how things should be. "Philosophia" is the Ancient Greek word for the "love of wisdom". A person who does philosophy is called a philosopher. A philosopher is a kind of thinker or researcher. A "philosophy" can also mean a group of ideas by philosophers, or by a philosopher. Philosophy is a way of thinking about the world, the universe, and society. In the past, sciences were part of philosophy as well.</p>
    <h3>questions asked by philosophers are these:</h3>
    <ul>
    <li>What happens to a soul after death, how does a soul enter into the body before death?</li>
    <li>Why are we born?</li>
    <li>Why should we live?</li>
    <li>Why are there so many hurdles in life?</li>
    <li>How do we overcome suffering?</li>
    <li>What is the importance of the material life?</li>
    <li>Will the universe exist forever?</li>
    <li>What is beauty?</li>
    <li>Do we have free will?</li>
    <li>Does God exist?</li>
    <li>Does the world around us exist?</li>
    <li>What is truth?</li>
    <li>What is evil?</li>
    <li>What is the relationship between mind and body?</li>
    </ul>

    <h2>Areas of inquiry</h2>
    <p>Philosophy is the study of humans and the world by thinking and asking questions. It is a science and an art. Philosophy tries to answer important questions by coming up with answers about real things and asking "why?"</p>
    <p>Sometimes, philosophy tries to answer the same questions as religion and science. Philosophers do not all give the same answers to a question. Many types of philosophy criticize or even attack the beliefs of science and religion.</p>
    </div>`,
  });

  const editor = new BangleEditor(domNode, { state });
  return editor;
}

const collapsePlugin = new Plugin({
  state: {
    init(_, state) {
      return buildDeco(state);
    },
    apply(tr, old, oldState, newState) {
      // For performance only build the
      // decorations if the doc has actually changed
      return tr.docChanged ? buildDeco(newState) : old;
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    },
  },
});

function buildDeco(state) {
  const collapsedHeadingSet = new Set(
    listCollapsedHeading(state).map((r) => r.node),
  );

  const headings = listCollapsibleHeading(state).filter(
    (r) => r.node.content.size > 0,
  );

  // See https://prosemirror.net/docs/ref/#view.Decoration^widget
  return DecorationSet.create(
    state.doc,
    // Create a decoration for each heading that is collapsible
    headings.map((match) =>
      Decoration.widget(
        match.pos + 1,
        (view) =>
          createCollapseDOM(
            view,
            collapsedHeadingSet.has(match.node),
            match.pos,
          ),
        // render deco before cursor
        { side: -1 },
      ),
    ),
  );
}

// Create a dom element:
// - will be placed at the right position by Prosemirror
// - will respond to click event and trigger the toggleHeadingCollapse command
function createCollapseDOM(view, isCollapsed, pos) {
  const child = document.createElement('span');
  child.addEventListener('click', function (e) {
    const tr = view.state.tr;
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos))));
    toggleHeadingCollapse()(view.state, view.dispatch, view);
  });

  child.style.userSelect = 'none';
  child.style.cursor = 'pointer';
  child.innerText = isCollapsed ? '▶️' : '▼';
  return child;
}

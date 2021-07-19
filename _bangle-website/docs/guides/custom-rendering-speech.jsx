import '@bangle.dev/core/style.css';
import {
  NodeView,
  domSerializationHelpers,
  corePlugins,
  coreSpec,
} from '@bangle.dev/core';

import { safeInsert } from '@bangle.dev/utils';
import { BangleEditor, useEditorState } from '@bangle.dev/react';
import { keymap } from 'prosemirror-keymap';
import React, { useEffect, useState } from 'react';

const speech = {
  spec() {
    const name = 'speech';
    const { toDOM, parseDOM } = domSerializationHelpers(name, {
      tag: 'div',
      content: 0,
    });

    return {
      type: 'node',
      name: 'speech',
      schema: {
        content: 'inline*',
        group: 'block',
        draggable: false,
        toDOM,
        parseDOM,
      },
    };
  },
  plugins() {
    return [
      keymap({
        'Ctrl-d': createSpeechNode(),
      }),
      NodeView.createPlugin({
        name: 'speech',
        containerDOM: ['div', { class: 'speech-container' }],
        contentDOM: ['span', { class: 'speech-text' }],
      }),
    ];
  },
};

export default function Example() {
  const editorState = useEditorState({
    specs: [...coreSpec(), speech.spec()],
    plugins: () => [...corePlugins(), speech.plugins()],
    initialValue: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Let us play some sound 🎶',
            },
          ],
        },
        {
          type: 'speech',
          content: [
            {
              type: 'text',
              text: 'I am a robot',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Press Ctrl-d to create more nodes',
            },
          ],
        },
      ],
    },
  });

  return (
    <BangleEditor
      state={editorState}
      renderNodeViews={({ node, updateAttrs, children }) => {
        if (node.type.name === 'speech') {
          return (
            <Speech node={node} updateAttrs={updateAttrs}>
              {children}
            </Speech>
          );
        }
      }}
    />
  );
}

export function createSpeechNode(text = 'Hello !') {
  return (state, dispatch) => {
    const type = state.schema.nodes.speech;
    const node = type.createChecked(undefined, state.schema.text(text));
    const newTr = safeInsert(node, state.selection.from)(state.tr);
    if (dispatch) {
      dispatch(newTr);
    }
    return true;
  };
}

function Speech({ node, children }) {
  const [lang, setLang] = useState('');
  const [voices, setVoices] = useState(speechSynthesis.getVoices());

  const onPlay = () => {
    window.speechSynthesis.cancel();
    const utterThis = new SpeechSynthesisUtterance(node.textContent);
    utterThis.lang = lang;
    speechSynthesis.speak(utterThis);
  };

  useEffect(() => {
    if (speechSynthesis.addEventListener) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        setVoices(speechSynthesis.getVoices());
      });
    }
  }, []);

  return (
    <div
      style={{
        backgroundColor: 'lightsteelblue',
        borderRadius: 4,
        margin: '0.5rem 1rem',
        padding: '0.5rem 1rem',
      }}
    >
      <div
        className="your-land"
        contentEditable={false}
        style={{ userSelect: 'none' }}
      >
        <select
          value={lang}
          onChange={(e) => {
            setLang(e.target.value);
          }}
        >
          {voices.map((voice) => (
            <option key={voice.name} value={voice.lang}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        <button type="button" onClick={onPlay}>
          Play
        </button>
      </div>
      {children}
    </div>
  );
}

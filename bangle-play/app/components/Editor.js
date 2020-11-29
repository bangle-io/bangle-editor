import React from 'react';
import PropTypes from 'prop-types';
import { PluginKey } from 'prosemirror-state';

import { getIdleCallback, uuid } from '@banglejs/core/utils/js-utils';
import * as collab from 'bangle-plugins/collab/client/collab-extension';
import { collabRequestHandlers } from 'bangle-plugins/collab/client/collab-request-handlers';
import * as coreComps from '@banglejs/core/components/index';
import { NodeView } from '@banglejs/core/node-view';
import { emoji, emojisArray } from '@banglejs/emoji/index';
import { trailingNode } from 'bangle-plugins/trailing-node/index';
import { timestamp } from 'bangle-plugins/timestamp/index';
import { ReactEditor } from '@banglejs/react/ReactEditor';
import stopwatch from '@banglejs/react-stopwatch';
import sticker from '@banglejs/react-sticker';
import { specRegistry } from '../editor/spec-sheet';
import {
  EmojiSuggestMenu,
  emojiSuggestMenu,
  floatingMenu,
  FloatingMenu,
} from '@banglejs/react-menu';

const LOG = false;
const DEBUG = true;
let log = LOG ? console.log.bind(console, 'play/Editor') : () => {};

const getScrollContainer = (view) => {
  return view.dom.parentElement.parentElement;
};

const menuKey = new PluginKey('menuKey');
const emojiSuggestKey = new PluginKey('emojiSuggestKey');

const getPlugins = ({ docName, manager }) => {
  const collabOpts = {
    docName: docName,
    clientId: 'client-' + uuid(4),
    ...collabRequestHandlers((...args) =>
      // TODO fix this resp.body
      manager.handleRequest(...args).then((resp) => resp.body),
    ),
  };
  return [
    floatingMenu.plugins({
      key: menuKey,
      tooltipRenderOpts: {
        getScrollContainer,
      },
    }),
    emojiSuggestMenu.plugins({
      key: emojiSuggestKey,
      emojis: emojisArray,
      tooltipRenderOpts: {
        getScrollContainer,
      },
    }),
    coreComps.bold.plugins(),
    coreComps.code.plugins(),
    coreComps.italic.plugins(),
    coreComps.strike.plugins(),
    coreComps.link.plugins(),
    coreComps.underline.plugins(),
    coreComps.paragraph.plugins(),
    coreComps.blockquote.plugins(),
    coreComps.bulletList.plugins(),
    coreComps.codeBlock.plugins(),
    coreComps.hardBreak.plugins(),
    coreComps.heading.plugins(),
    coreComps.horizontalRule.plugins(),
    coreComps.listItem.plugins(),
    coreComps.orderedList.plugins(),
    coreComps.todoItem.plugins({ nodeView: false }),
    coreComps.todoList.plugins(),
    coreComps.image.plugins(),
    coreComps.history.plugins(),
    collab.plugins(collabOpts),
    emoji.plugins(),
    stopwatch.plugins(),
    trailingNode.plugins(),
    timestamp.plugins(),
    sticker.plugins(),
    NodeView.createPlugin({
      name: 'todoItem',
      containerDOM: [
        'li',
        {
          'data-bangle-name': 'todoItem',
        },
      ],
      contentDOM: ['span', {}],
    }),
  ];
};

export class Editor extends React.PureComponent {
  static propTypes = {
    isFirst: PropTypes.bool.isRequired,
    manager: PropTypes.object.isRequired,
    docName: PropTypes.string.isRequired,
  };
  devtools = this.props.isFirst && (isJestIntegration() || DEBUG);

  options = {
    id: 'bangle-play-' + this.props.docName + '-' + uuid(4),
    content: 'Loading document',
    devtools: this.devtools,
    specRegistry,
    plugins: getPlugins({
      docName: this.props.docName,
      manager: this.props.manager,
    }),
  };

  componentWillUnmount() {
    console.log('unmounting editor', this.props.docName);
    if (this.props.isFirst) {
      window.editor = undefined;
    }
  }

  onEditorReady = (editor) => {
    if (this.props.isFirst) {
      window.editor = editor;

      if (process.env.NODE_ENV !== 'integration') {
        getIdleCallback(() => {
          import(
            /* webpackChunkName: "prosemirror-dev-tools" */ 'prosemirror-dev-tools'
          ).then((args) => {
            this.devtools = args.applyDevTools(editor.view);
          });
        });
      }
    }
  };

  renderNodeViews = ({ node, updateAttrs, children, selected }) => {
    if (node.type.name === 'sticker') {
      return (
        <sticker.Sticker
          node={node}
          updateAttrs={updateAttrs}
          selected={selected}
        />
      );
    }

    if (node.type.name === 'stopwatch') {
      return <stopwatch.Stopwatch node={node} updateAttrs={updateAttrs} />;
    }

    if (node.type.name === 'todoItem') {
      return (
        <TodoItem node={node} updateAttrs={updateAttrs}>
          {children}
        </TodoItem>
      );
    }
  };

  render() {
    return (
      <>
        <ReactEditor
          options={this.options}
          onReady={this.onEditorReady}
          renderNodeViews={this.renderNodeViews}
        >
          <FloatingMenu menuKey={menuKey} />
          <EmojiSuggestMenu
            emojiSuggestKey={emojiSuggestKey}
            emojis={emojisArray}
          />
        </ReactEditor>
      </>
    );
  }
}

function TodoItem({ children, node, updateAttrs }) {
  const { done } = node.attrs;
  return (
    <>
      <span contentEditable={false}>
        <input
          type="checkbox"
          onChange={() => {
            updateAttrs({
              done: !done,
            });
          }}
          checked={!!done}
        />
      </span>
      {children}
    </>
  );
}

function isJestIntegration() {
  return process.env.NODE_ENV === 'test' && process.env.JEST_INTEGRATION;
}

import 'prosemirror-gapcursor/style/gapcursor.css';

import ReactDOM from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';

import { ReactEditor } from 'bangle-core/helper-react/react-editor';
import { uuid } from 'bangle-core/utils/js-utils';
import { Header } from './Header';
import { editorSpec } from '../editor/editor-spec';
import { collabRequestHandlers } from 'bangle-plugins/collab/client/collab-request-handlers';
import * as collab from 'bangle-plugins/collab/client/collab-extension';
import { dinos } from 'bangle-plugins/dinos/index';
import { corePlugins } from 'bangle-core/components';
import { config } from '../editor/config';
import { emoji, emojiInlineSuggest } from 'bangle-plugins/emoji/index';
import * as floatingMenu from 'bangle-plugins/inline-menu/floating-menu';
import * as linkMenu from 'bangle-plugins/inline-menu/link-menu';
import { PluginKey } from 'prosemirror-state';
import { stopwatch } from 'bangle-plugins/stopwatch/index';
import { trailingNode } from 'bangle-plugins/trailing-node/index';
import { timestamp } from 'bangle-plugins/timestamp/index';

const LOG = false;
const DEBUG = true;
let log = LOG ? console.log.bind(console, 'play/Editor') : () => {};

const getScrollContainerDOM = (view) => {
  return view.dom.parentElement.parentElement;
};

const getPlugins = ({ docName, manager }) => {
  const collabOpts = {
    docName: docName,
    clientId: 'client-' + uuid(4),
    ...collabRequestHandlers((...args) =>
      // TODO fix this resp.body
      manager.handleRequest(...args).then((resp) => resp.body),
    ),
  };
  const linkMenuKey = new PluginKey('linkMenuKeyYes');
  return [
    ...corePlugins({ node: { heading: { levels: config.headingLevels } } }),
    collab.plugins(collabOpts),
    dinos.plugins(),
    emoji.plugins(),
    linkMenu.plugins({
      key: linkMenuKey,
      getScrollContainerDOM,
    }),
    floatingMenu.plugins({
      getScrollContainerDOM,
      linkMenuKey,
    }),

    emojiInlineSuggest.plugins({
      markName: 'emoji_inline_suggest',
      trigger: ':',
    }),
    stopwatch.plugins(),
    trailingNode.plugins(),
    timestamp.plugins(),
  ];
};

export class Editor extends React.PureComponent {
  static propTypes = {
    isFirst: PropTypes.bool.isRequired,
    manager: PropTypes.object.isRequired,
    docName: PropTypes.string.isRequired,
  };
  devtools = this.props.isFirst && (process.env.JEST_INTEGRATION || DEBUG);
  inlineMenuDOM = document.createElement('div');

  options = {
    id: 'bangle-play-' + this.props.docName + '-' + uuid(4),
    content: 'Loading document',
    devtools: this.devtools,
    editorSpec: editorSpec,
    plugins: getPlugins({
      docName: this.props.docName,
      manager: this.props.manager,
    }),
    editorProps: {
      attributes: { class: 'bangle-editor content' },
    },
  };

  componentWillUnmount() {
    console.log('unmounting editor', this.props.docName);
  }

  render() {
    log('updateding', this.props.isFirst);
    return (
      <>
        {this.inlineMenuDOM &&
          ReactDOM.createPortal(<Header />, this.inlineMenuDOM)}
        <ReactEditor options={this.options} />
      </>
    );
  }
}

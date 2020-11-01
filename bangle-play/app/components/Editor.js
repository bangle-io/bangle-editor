import 'prosemirror-gapcursor/style/gapcursor.css';

import ReactDOM from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';

import { ReactEditor } from 'bangle-core/helper-react/react-editor';
import { extensions } from '../editor/extensions';
import { uuid } from 'bangle-core/utils/js-utils';
import { Header } from './Header';
import {} from 'bangle-core/marks/index';
import { editorSpec } from '../editor/spec';
const LOG = false;
const DEBUG = true;
let log = LOG ? console.log.bind(console, 'play/Editor') : () => {};

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
    // spec: spec,
    extensions: [
      ...extensions({
        switchOffShit: false,
        inlineMenuComponent: this.inlineMenuDOM,
        collabOpts: {
          docName: this.props.docName,
          manager: this.props.manager,
          clientId: 'client-' + uuid(4),
        },
      }),
    ],
    editorProps: {
      attributes: { class: 'bangle-editor content' },
    },
    onInit: ({ view, state }) => {},
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

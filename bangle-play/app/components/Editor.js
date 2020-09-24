import ReactDOM from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';

import { ReactEditor } from 'bangle-core/helper-react/react-editor';
import { extensions } from '../editor/extensions';
import { uuid } from 'bangle-core/utils/js-utils';
import { Header } from './Header';

const DEBUG = true;

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
    extensions: [
      ...extensions({
        inlineMenuDOM: this.inlineMenuDOM,
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
  };

  componentWillUnmount() {
    console.log('unmounting editor', this.props.docName);
  }

  render() {
    return (
      <>
        <ReactEditor options={this.options} />
        {this.inlineMenuDOM &&
          ReactDOM.createPortal(<Header />, this.inlineMenuDOM)}
      </>
    );
  }
}

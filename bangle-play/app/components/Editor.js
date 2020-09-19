import React from 'react';
import PropTypes from 'prop-types';

import { ReactEditor } from 'bangle-core/helper-react/react-editor';
import { extensions } from '../editor/extensions';
import { uuid } from 'bangle-core/utils/js-utils';

const DEBUG = true;

export class Editor extends React.PureComponent {
  static propTypes = {
    isFirst: PropTypes.bool.isRequired,
    editor: PropTypes.func.isRequired,
    manager: PropTypes.object.isRequired,
    docName: PropTypes.string.isRequired,
  };

  devtools = this.props.isFirst && (process.env.JEST_INTEGRATION || DEBUG);

  options = (docName, id) => ({
    docName,
    manager: this.props.manager,
    id,
    devtools: this.devtools,
    extensions: extensions(),
    editorProps: {
      attributes: { class: 'bangle-editor content' },
    },
  });

  componentWillUnmount() {
    console.log('unmounting editor', this.props.docName);
  }

  render() {
    const docName = this.props.docName;
    const editor = this.props.editor;
    return (
      <ReactEditor
        options={this.options(
          docName,
          'bangle-play-react-editor-' + docName + '-' + uuid(4),
        )}
        content={docName}
        Editor={editor}
      />
    );
  }
}

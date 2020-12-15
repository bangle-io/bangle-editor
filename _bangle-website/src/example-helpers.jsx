import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function VanillaCodeExample({
  filePath,
  language,
  createEditor,
  onEditorReady = () => {},
  SideCar,
}) {
  const createRef = useRef(createEditor);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const component = useCallback(
    () => (
      <VanillaEditor
        createEditor={createRef.current}
        onReady={setEditorLoaded}
      />
    ),
    [createRef, setEditorLoaded],
  );
  return (
    <>
      <ReactCodeExample
        filePath={filePath}
        language={language}
        component={component}
      />
      {editorLoaded ? onEditorReady(editorLoaded) : null}
      {editorLoaded && SideCar ? <SideCar editor={editorLoaded} /> : null}
    </>
  );
}

export function VanillaEditor({ createEditor, onReady }) {
  const editorRef = useRef();

  useEffect(() => {
    const editor = createEditor(editorRef.current);
    onReady(editor);
    return () => {
      editor.destroy();
    };
  }, [createEditor, onReady]);

  return <div ref={editorRef} />;
}

export function ReactCodeExample({ filePath, language, component }) {
  return (
    <Tabs
      defaultValue="example"
      values={[
        { label: 'Example', value: 'example' },
        { label: 'Source code', value: 'src' },
      ]}
    >
      <TabItem value="example">
        <BrowserOnly>{component}</BrowserOnly>
      </TabItem>
      <TabItem value="src">
        <SourceCode filePath={filePath} language={language} />
      </TabItem>
    </Tabs>
  );
}

ReactCodeExample.propTypes = {
  component: PropTypes.func.isRequired,
  language: PropTypes.string,
  filePath: PropTypes.string.isRequired,
};

export function SourceCode({ filePath, language = 'js' }) {
  const [data, setData] = useState();
  useEffect(() => {
    let unmounted = false;
    loadJSCode(filePath)
      .then((text) => {
        if (!unmounted) {
          setData(text);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!unmounted) {
          setData('Error: Could not load source code at ' + filePath);
        }
      });

    return () => {
      unmounted = true;
    };
  }, [setData, filePath]);

  return data ? (
    <CodeBlock className={'language-' + language}>{data}</CodeBlock>
  ) : (
    'loading...'
  );
}

function loadJSCode(filePath) {
  return fetch(filePath).then((r) => r.text());
}

export function formatHTMLString(html) {
  var tab = '  ';
  var result = '';
  var indent = '';

  html.split(/>\s*</).forEach(function (element) {
    if (element.match(/^\/\w/)) {
      indent = indent.substring(tab.length);
    }

    result += indent + '<' + element + '>\r\n';

    if (element.match(/^<?\w[^>]*[^\/]$/)) {
      indent += tab;
    }
  });

  return result.substring(1, result.length - 3);
}

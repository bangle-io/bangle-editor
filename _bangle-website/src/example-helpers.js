import React, { useEffect, useState } from 'react';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

export function ReactCodeExample({ filePath, language, children }) {
  return (
    <Tabs
      defaultValue="example"
      values={[
        { label: 'Example', value: 'example' },
        { label: 'Source code', value: 'src' },
      ]}
    >
      <TabItem value="example">{children}</TabItem>
      <TabItem value="src">
        <SourceCode filePath={filePath} language={language} />
      </TabItem>
    </Tabs>
  );
}

function SourceCode({ filePath, language = 'js' }) {
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

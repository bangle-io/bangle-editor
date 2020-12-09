---
title: '@banglejs/react'
sidebar_label: '@banglejs/react'
packageName: '@banglejs/react'
id: 'react'
---

This package provides you with a React API for integrating BangleJS in your React app.

### Installation

```sh
npm install @banglejs/react
```

### Usage

```jsx
import { useEditorState, BangleEditorView } from '@banglejs/react';

export default function Editor() {
  const editorState = useEditorState({
    initialValue: 'Hello world!',
  });
  return <BangleEditorView editorState={editorState} />;
}
```

> Do not forget to load the stylesheet at '@banglejs/core/style.css'

## BangleEditorView: {{global.link.ReactElement}}

A React component for rendering a Bangle instance.

### Props

- **id**: ?string\
  The [id](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id) of the DOM node bangle mounts on. Please make sure this is unique if you are having multiple editors.
- **renderNodeViews**: ?fn({ children, node, view, getPos, decorations, selected, attrs, updateAttrs}) -> {{global.link.ReactElement}} \
  Callback to render to custom NodeView. This will be called with the `node` and you are expected to exhaustively return the React rendering output of each `node.type`. See {{global.link.ReactCustomRenderingGuide}}
- **focusOnInit**: ?boolean=true \
  Brings editor to focus when it loads.
- **onReady**: ?fn(editor) \
  A callback which is called when the editor has mounted.
- **children**: ?{{global.link.ReactElement}} \
  React components which need the editor context but are not directly rendered inside of the `contentEditable` of the editor. A good example of what can be `children` is {{reactMenu.link.FloatingMenu}}.
- **state**: {{core.link.BangleEditorState}} \
  The output of [useEditorState] hook.
- **pmViewOpts**: ?[Prosemirror.DirectEditorProps](https://prosemirror.net/docs/ref/#view.DirectEditorProps) \
  Please make sure you fully understand what you are doing when using this prop.

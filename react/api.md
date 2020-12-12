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
import { useEditorState, BangleEditor } from '@banglejs/react';

export default function Editor() {
  const editorState = useEditorState({
    initialValue: 'Hello world!',
  });
  return <BangleEditor editorState={editorState} />;
}
```

> :bulb: **Do not forget to load the stylesheet located at _'@banglejs/core/style.css'._ See {{global.link.StylingGuide}} for more details on how to customize styling of your editor.**

## BangleEditor: {{global.link.ReactElement}}

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
  Pass in the output of [useEditorState](#useeditorstate-reacthook) hook.

- **pmViewOpts**: ?[Prosemirror.DirectEditorProps](https://prosemirror.net/docs/ref/#view.DirectEditorProps) \
  Please make sure you fully understand what you are doing when using this prop.

## useEditorState: ReactHook

> fn({{ core.link.BangleEditorStateProps }}) -> {{core.link.BangleEditorState}}

A hook for initialing the editor state.

:book: **Checkout {{global.link.ReactExample}}**

## usePluginState: ReactHook

> fn(pluginKey`<T>`): T

A hook for hooking to a Prosemirror plugin's state. This will re-render the React component every-time the plugin's state changes.

:book: **Checkout {{global.link.ReactUsePluginStateGuide}}**

## useEditorViewContext: ReactHook

> fn(): {{Prosemirror.EditorView}}

A hook for providing the {{Prosemirror.EditorView}} to a React component. This context is only available to children the of `<BangleEditor />`. Since it returns `view`, it will never do a re-render as `view` instance is unique per Bangle editor. Please {{global.link.ReactUsePluginStateGuide}} for more examples.

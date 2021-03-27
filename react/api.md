---
title: '@bangle.dev/react'
sidebar_label: '@bangle.dev/react'
packageName: '@bangle.dev/react'
id: 'react'
---

This package provides you with a React API for integrating Bangle in your React app.

### Installation

```sh
{{npmInstallation "@bangle.dev/react"}}
```

### Usage

```jsx
import '@bangle.dev/core/style.css';

import { useEditorState, BangleEditor } from '@bangle.dev/react';

export default function Editor() {
  const editorState = useEditorState({
    initialValue: 'Hello world!',
  });
  return <BangleEditor state={editorState} />;
}
```

:bulb: **Do not forget to load the stylesheet located at '@bangle.dev/core/style.css'.**

## BangleEditor: {{global.link.ReactElement}}

A React component for rendering a Bangle instance.

### Props

- **id**: ?string\
  The [id](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id) of the DOM node bangle mounts on. Please make sure this is unique if you are having multiple editors.

- **renderNodeViews**: ?fn({ children, node, view, getPos, decorations, selected, attrs, updateAttrs}) -> {{global.link.ReactElement}} \
  Allows customization of how a Node is rendered in the DOM. This will be called with a `node` and you are expected to return a matching React component for the `node.type`. You are also expected to correctly nest the `children` props. Note: `children` prop is not available for [atom](https://prosemirror.net/docs/ref/#model.NodeSpec.atom) nodes. See {{global.link.ReactCustomRenderingGuide}}

- **focusOnInit**: ?boolean=true \
  Brings editor to focus when it loads.

- **onReady**: ?fn(editor) \
  A callback which is called when the editor has mounted.

- **children**: ?{{global.link.ReactElement}} \
  React components which need the editor context but are not directly editable i.e. do not lie inside the [contentEditable](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content) of the editor. A good example of what can be `children` is {{reactMenu.link.FloatingMenu}}.

- **state**: {{core.link.BangleEditorState}} \
  Pass in the output of [useEditorState](#useeditorstate-reacthook) hook.

- **pmViewOpts**: ?[Prosemirror.DirectEditorProps](https://prosemirror.net/docs/ref/#view.DirectEditorProps)

## useEditorState: ReactHook

> fn({{ core.link.BangleEditorStateProps }}) -> {{core.link.BangleEditorState}}

A hook for initialing the editor state.

:bulb: This hook will never trigger a re-render, if you want to react to a change in your editor consider using [usePluginState](#usepluginstate-reacthook). Read {{global.link.ReactBasicExample}}.

:book: **Checkout {{example.ReactBasicEditorExample}}**

## usePluginState: ReactHook

> fn(pluginKey`<T>`): T

A hook for hooking to a Prosemirror plugin's state. This hook works **only** with children of `<BangleEditor />`. This **will re-render** the React component every-time the plugin's state changes.

## useEditorViewContext: ReactHook

> fn(): {{Prosemirror.EditorView}}

A hook for providing the {{Prosemirror.EditorView}} to a React component. This context is **only** available to children of `<BangleEditor />`. It will **never** trigger a re-render as the hook maintains the same {{Prosemirror.EditorView}} instance throughout the editor's lifecycle.

:book: **Checkout [Floating menu dropdown](/docs/examples/react-floating-menu#menu-dropdown) example.**

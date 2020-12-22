---
title: '@bangle.dev/text-formatting'
sidebar_label: '@bangle.dev/text-formatting'
packageName: '@bangle.dev/text-formatting'
id: 'text_formatting'
---

`contrib`

Provides more text formatting components on top of the ones provides by `@bangle.dev/core`.

```
{{npmInstallation "@bangle.dev/text-formatting"}}
```

### subscript: {{core.link.Component}}

Allows text to marked as [subscript](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub). **Note**: Expects a spec named `superscript` to exist, you should either use it with provided `superscript` component or create one of yours.

#### spec(): {{core.link.MarkSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

#### defaultKeys: {{core.link.Keybindings}}

- **toggleSubscript** = `null`: toggle subscript, disabled by default.

#### commands: {{core.link.CommandObject}}

- **toggleSubscript**(): {{core.link.Command}}\
  Toggles subscript mark.

- **queryIsSubscriptActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a subscript mark or not.

**Usage**

See [example](/docs/examples/text-formatting#superscript--subscript).

### superscript: {{core.link.Component}}

Allows text to marked as [superscript](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/super). **Note**: Expects a spec named `subscript` to exist, you should either use it with provided `subscript` component or create one of yours.

#### spec(): {{core.link.MarkSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

#### defaultKeys: {{core.link.Keybindings}}

- **toggleSuperscript** = `null`: toggle superscript, disabled by default.

#### commands: {{core.link.CommandObject}}

- **toggleSuperscript**(): {{core.link.Command}}\
  Toggles superscript mark.

- **queryIsSuperscriptActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a superscript mark or not.

**Usage**

See [example](/docs/examples/text-formatting#superscript--subscript).

---
title: '@bangle.dev/search'
sidebar_label: '@bangle.dev/search'
packageName: '@bangle.dev/search'
id: 'search'
---

`contrib`

This package allows your to highlight search text in your editor.

### Installation

```
{{npmInstallation "@bangle.dev/search"}}
```

## Styling

Please use the stylesheet `style.css` like:

```js
import '@bangle.dev/search/style.css';
```

## search: {{core.link.Component}}

#### spec({ ... }): {{core.link.Component}}

### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- **key:** ?{{Prosemirror.PluginKey}}

- **query**: Regex | string | undefined\
  The search query to determine which text needs highlight.

- **className**: ?string="bangle-search-match"\
  The class name of the search highlight element.

- **maxHighlights:** ?number=1500\
  The maximum number of search highlights.

### commands: {{core.link.CommandObject}}

- **updateSearchQuery**(key: {{Prosemirror.PluginKey}}, query: Regex | string | undefined): {{core.link.Command}}\
  Updates the search query. Set the query to `undefined` to clear all highlights.

**Usage**

```js
const searchPluginKey = new PluginKey('search');

const plugins = [
  // other plugins
  search.plugins({ query: /hello/, key: searchPluginKey })
];

// command
updateSearchQuery(searchPluginKey, query: undefined)
```

**NOTE: until we hit v1, expect breaking changes the minor versions (0.x).**

## 0.10.5

**@bangle.dev/core**

- chore: Export the list item commands `insertEmptySiblingListAbove` & `insertEmptySiblingListBelow`.

## 0.10.4

**@bangle.dev/core**

- chore: added insert para above/below commands to blockquote & heading.
- chore: export `prosemirror-keymap` via `@bangle.dev/core/prosemirror/keymap`.

## 0.10.3

**@bangle.dev/core**

- bug: `editorStateCounter` was missing in bangle.dev/core.

## 0.10.2

- chore: doc updates and cleanup

## 0.10.1

- chore: doc updates and cleanup

## 0.10.0

**@bangle.dev/core**

- breaking bug: Follow stricter ESM (ecma-script module) pattern by not having `index.js` within sub-directories of a module. Unlike node resolver, importing a folder in ESM does not return the index.js file in the folder.

If you were doing something like `import {xyz} from '@bangle.dev/core/components/index'` please instead do `import {xyz} from '@bangle.dev/core'` or directly import the file `import {xyz} from '@bangle.dev/core/components/doc'`.

```js
// make this
import { doc, heading } from '@bangle.dev/core/components/index';

// into this
import { components } from '@bangle.dev/core';
const { doc, heading } = components;

// or
import doc from '@bangle.dev/core/components/doc';
```

## 0.9.1

**@bangle.dev/tooltip**

- bug: suggest tooltip now resets counter on hide.
- feat: triggers can now be more than one characters.

## 0.9.0

**@bangle.dev/core**

- feat: adding a new `tight` attribute to ordered and unorder list components.

**@bangle.dev/markdown**

- feat: Markdown parsing now remembers whether lists are tightly spaced or not.

## 0.8.0

**@bangle.dev/core**

- feat: add `insertEmptyParagraphBelow`, `insertEmptyParagraphAbove` command to paragraph component.
- feat: add `moveListItemUp`, `moveListItemDown` to listItem component.

**@bangle.dev/react-menu**

- bug: disable menu buttons when view is not editable

## 0.7.2

**@bangle.dev/react-emoji-suggest**

- bug: stray console statement

## 0.7.1

**@bangle.dev/table**

- bug: Renamed table.css to style.css

## 0.7.0

**@bangle.dev/markdown**

- feat: Now parses and serializes markdown

**@bangle.dev/table**

- NEW package for dealing with tables!

## 0.6.0

**@bangle.dev/react-menu**

- bug: Use button attribute for menu items

**@bangle.dev/markdown**

- bug: When opening a file with empty list item crashed the editor.

## 0.5.1

**@bangle.dev/core**

- bug: Fix css settings that were being applied globally instead of scoped to the editor.
- bug: Fix css margins for the first child of the editor.

## 0.5.0

**@bangle.dev/react-menu**

- feat: Added an undo and redo button.

## 0.4.1

**@bangle.dev/core**

- deprecation: `BangleEditorState` expects `plugins` named parameter to be a function. Previous usage of an array of plugins is now deprecated.

## 0.4.0

- bug: Fix cyclic dependencies across the project.
- chore: Moved away from `export * as xyz` syntax as it causes problem with certain bundlers.

## 0.3.3

**@bangle.dev/core**

- bug: Fixed issue in collab by checking the position when restarting.

## 0.3.2

**@bangle.dev/core**

- bug: Fixed bugs related todo list joining and working with list items.
- bug: Fixed when pressing an enter on a checked todo created another checked todo list.
- bug: Fixed issue in collab by checking the position when restarting.

## 0.3.1

**@bangle.dev/core**

- bug: Fixed some bugs which cause non-intuitive toggling between todo bullet lists and regular bullet lists.

## 0.3.0

**@bangle.dev/core**

- bug: Fixed an issue when toggling a nested list item with empty sibbling caused errors.

- **breaking**: todoList and todoItem no longer exist and now have been implemented with bulletList and listItem with the node attribute `todoChecked`.

## 0.2.1

**@bangle.dev/core**

- patch: expose `flattenFragmentJSON` in heading component.

## 0.2.0

**@bangle.dev/core**

- feat: Collapsible headings https://github.com/bangle-io/bangle.dev/pull/145

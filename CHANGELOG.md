**NOTE: until we hit v1, expect breaking changes the minor versions (0.x).**

## HEAD

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

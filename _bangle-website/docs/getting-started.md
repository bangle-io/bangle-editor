---
title: Getting started
sidebar_label: Getting Started
---

To get started with bangle.dev you need to install the core module:

```
npm install @bangle.dev/core
```

## With React

Bangle at its heart is framework agnostic, but it comes with first party support for React. To get started, run the follow command:

```
npm install @bangle.dev/react
```

## Build tools

I have setup a repo to showcase how to use Bangle.dev with various contemporary bundlers. Lets be honest, frontend setup is a nightmare 🧟‍♀️ and the last thing I want is someone fiddling with Webpack or Babel config:

- [create-react-app-v4](https://github.com/bangle-io/bangle.dev-boilerplates/tree/main/react__create-react-app-v4)
- [create-react-app-v3](https://github.com/bangle-io/bangle.dev-boilerplates/tree/main/react__create-react-app-v3)
- [react webpack 4](https://github.com/bangle-io/bangle.dev-boilerplates/tree/main/react__webpack-v4)
- [vanilla-js vite](https://github.com/bangle-io/bangle.dev-boilerplates/tree/main/vanillajs__vite)

Feel free to send a Pull Request for your favorite build tool. If setup looks good, head over to the [examples](https://bangle.dev/docs/examples/markdown-editor)!

:heart: Support for **Vue** is coming soon. Meanwhile you can either use vanilla Bangle Components _or_ consider [tiptap](https://github.com/ueberdosis/tiptap) an awesome library which runs the same [Prosemirror](https://prosemirror.net) blood in its veins!

## Stability

**Current**:

- Bangle is currently in `beta` phase and we plan to iterate fast, bug fixes and many breaking changes. I would request you to try it out and use it in your side projects but avoid using it in **production**.

## The Bangle eco-system

The Bangle project is made up of smaller individual packages to fit a particular scoped need. You can find their documentation under the API section of the sidebar. Please keep the following things in mind when consuming any of the Bangle packages:

- Only the packages with names starting `@bangle.dev/react-` require a React dependency.

- Certain packages have a peer dependency on other Bangle packages, your package manager should help you install them.

- If a package has a stylesheet, it will always under a file named `style.css` and can be imported by doing `import @bangle.dev/xyz-module/style.css`.

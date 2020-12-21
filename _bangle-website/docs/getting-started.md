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

:heart: Support for **Vue** is coming soon. Meanwhile you can either use vanilla Bangle Components _or_ consider [tiptap](https://github.com/ueberdosis/tiptap) an awesome library which runs the same [Prosemirror](https://prosemirror.net) blood in its veins!

## Stability

**Current**:

- Bangle is currently in `alpha` phase and we plan to iterate fast, bug fixes and many breaking changes. I would request you to try it out and use it in yoru side projects but avoid using it in **production**.

**Next Month**:

- I think by mid January, I will have solicited enough feedback from folks that we can move to `beta` and address the feedback. Focus will be on stability and building a project roadmap.

**Short term**:

- Once we achieve a good stable month with `beta` with some community adoption, we can move to general release. I expect this to come around March or April.

## The Bangle eco-system

The Bangle project is made up of smaller individual packages to fit a particular scoped need. You can find their documentation under the API section of the sidebar. Please keep the following things in mind when consuming any of the Bangle packages:

- Only the packages with names starting `@bangle.dev/react-` require a React dependency.

- Certain packages have a peer dependency on other Bangle packages, your package manager should help you install them.

- If a package has a stylesheet, it will always under a file named `style.css` and can be imported by doing `import @bangle.dev/xyz-module/style.css`.

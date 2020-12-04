---
title: Getting started
sidebar_label: Getting Started
---

To get started with BangleJS you need to install the core module:

```
npm install @banglejs/core
```

## With React

BangleJS at its heart is framework agnostic, but it comes with first party support for React. To get started, run the follow command:

```
npm install @banglejs/react
```

## Vue ?

:heart: _Support for **Vue** is coming soon_

Meanwhile you can either use vanilla BangleJS Components _or_ consider [tiptap](https://github.com/ueberdosis/tiptap) an awesome library which runs the same [Prosemirror](https://prosemirror.net) blood in its veins!

## The Bangle eco-system

The BangleJS project is made up of smaller individual packages to fit a particular scoped need. You can find their documentation under the API section of the sidebar. Please keep the following things in mind when consuming any of the Bangle packages:

- Only the packages with names starting `@banglejs/react-` require a React dependency.

- Certain packages have a peer dependency on other Bangle packages, your package manager should help you install them.

- If a package has a stylesheet, it will always under a file named `style.css` and can be imported by doing `import @banglejs/xyz-module/style.css`. Please refer to the styling guide for more info.

  - TODO styling guide link

- Majority of Bangle packages export a Component. Please refer to the API of each package on how to consume them.

  - TODO add a link to component

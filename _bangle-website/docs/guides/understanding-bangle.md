---
title: Understanding Bangle
---

In this guide we will be creating a basic editor WSYIWG editor with vanilla JS. The concepts mentioned will also help you when using Bangle with your favourite framework.

### Brief

BangleJS is a library for building powerful text editing experiences for the web. It uses a library called _[Prosemirror](https://prosemirror.net/)_ to interface with the contentEditable DOM. Prosemirror is an amazing library, after trying other libraries (slatejs, quilljs, editor.js) I setting with Prosemirror because:

- Expressiveness: Other libraries are happy to state that you can build the next google docs with them, but fail to deliver on it. After spending couple of months with Prosemirror, I was clear that the choices the library has made, do infact allow for building powerful editors like google docs or dropbox paper.

- Right abstractions: Prosemirror allows 

- Documentation & Community: Prosemirror has great documentation and their community forums are very helpful.

- Collaboration: Live collaboration comes baked in with Prosemirror.

This [blog](https://marijnhaverbeke.nl/blog/collaborative-editing.html) post by Prosemirror's author does a great job on explaining some aspects of it.

Let us understand a basic editor with Bangle and along with that learn a couple of core concepts.

### Configuring

To create an Editor instance you should setup your code like:

```
```

As you noticed above, to create an Editor you need to have the following 
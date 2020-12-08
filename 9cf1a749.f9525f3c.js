(window.webpackJsonp=window.webpackJsonp||[]).push([[29],{100:function(e,t,r){"use strict";r.r(t),r.d(t,"frontMatter",(function(){return o})),r.d(t,"metadata",(function(){return l})),r.d(t,"rightToc",(function(){return c})),r.d(t,"default",(function(){return s}));var n=r(3),i=r(7),a=(r(0),r(122)),o={title:"Understanding Bangle"},l={unversionedId:"guides/understanding-bangle",id:"guides/understanding-bangle",isDocsHomePage:!1,title:"Understanding Bangle",description:"In this guide we will be creating a basic editor WSYIWG editor with vanilla JS. The concepts mentioned will also help you when using Bangle with your favourite framework.",source:"@site/docs/guides/understanding-bangle.md",slug:"/guides/understanding-bangle",permalink:"/bangle-play/docs/guides/understanding-bangle",editUrl:"https://github.com/kepta/bangle-play/edit/master/_bangle-website/docs/docs/guides/understanding-bangle.md",version:"current",sidebar:"docs",previous:{title:"Teeny Tiny Editor",permalink:"/bangle-play/docs/guides/teeny-tiny-editor"},next:{title:"Building a menu",permalink:"/bangle-play/docs/guides/menu"}},c=[{value:"Brief",id:"brief",children:[]},{value:"Configuring",id:"configuring",children:[]}],u={rightToc:c};function s(e){var t=e.components,r=Object(i.a)(e,["components"]);return Object(a.b)("wrapper",Object(n.a)({},u,r,{components:t,mdxType:"MDXLayout"}),Object(a.b)("p",null,"In this guide we will be creating a basic editor WSYIWG editor with vanilla JS. The concepts mentioned will also help you when using Bangle with your favourite framework."),Object(a.b)("h3",{id:"brief"},"Brief"),Object(a.b)("p",null,"BangleJS is a library for building powerful text editing experiences for the web. It uses a library called ",Object(a.b)("em",{parentName:"p"},Object(a.b)("a",Object(n.a)({parentName:"em"},{href:"https://prosemirror.net/"}),"Prosemirror"))," to interface with the contentEditable DOM. Prosemirror is an amazing library, after trying other libraries (slatejs, quilljs, editor.js) I setting with Prosemirror because:"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("p",{parentName:"li"},"Expressiveness: Other libraries are happy to state that you can build the next google docs with them, but fail to deliver on it. After spending couple of months with Prosemirror, I was clear that the choices the library has made, do infact allow for building powerful editors like google docs or dropbox paper.")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("p",{parentName:"li"},"Right abstractions: Prosemirror allows ")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("p",{parentName:"li"},"Documentation & Community: Prosemirror has great documentation and their community forums are very helpful.")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("p",{parentName:"li"},"Collaboration: Live collaboration comes baked in with Prosemirror."))),Object(a.b)("p",null,"This ",Object(a.b)("a",Object(n.a)({parentName:"p"},{href:"https://marijnhaverbeke.nl/blog/collaborative-editing.html"}),"blog")," post by Prosemirror's author does a great job on explaining some aspects of it."),Object(a.b)("p",null,"Let us understand a basic editor with Bangle and along with that learn a couple of core concepts."),Object(a.b)("h3",{id:"configuring"},"Configuring"),Object(a.b)("p",null,"To create an Editor instance you should setup your code like:"),Object(a.b)("pre",null,Object(a.b)("code",Object(n.a)({parentName:"pre"},{}),"")),Object(a.b)("p",null,"As you noticed above, to create an Editor you need to have the following "))}s.isMDXComponent=!0},122:function(e,t,r){"use strict";r.d(t,"a",(function(){return b})),r.d(t,"b",(function(){return g}));var n=r(0),i=r.n(n);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,i=function(e,t){if(null==e)return{};var r,n,i={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(i[r]=e[r]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(i[r]=e[r])}return i}var u=i.a.createContext({}),s=function(e){var t=i.a.useContext(u),r=t;return e&&(r="function"==typeof e?e(t):l(l({},t),e)),r},b=function(e){var t=s(e.components);return i.a.createElement(u.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},d=i.a.forwardRef((function(e,t){var r=e.components,n=e.mdxType,a=e.originalType,o=e.parentName,u=c(e,["components","mdxType","originalType","parentName"]),b=s(r),d=n,g=b["".concat(o,".").concat(d)]||b[d]||p[d]||a;return r?i.a.createElement(g,l(l({ref:t},u),{},{components:r})):i.a.createElement(g,l({ref:t},u))}));function g(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var a=r.length,o=new Array(a);o[0]=d;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:n,o[1]=l;for(var u=2;u<a;u++)o[u]=r[u];return i.a.createElement.apply(null,o)}return i.a.createElement.apply(null,r)}d.displayName="MDXCreateElement"}}]);
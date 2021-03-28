(window.webpackJsonp=window.webpackJsonp||[]).push([[50],{114:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return o})),n.d(t,"metadata",(function(){return l})),n.d(t,"rightToc",(function(){return c})),n.d(t,"default",(function(){return p}));var a=n(3),r=n(7),i=(n(0),n(154)),o={title:"Getting started",sidebar_label:"Getting Started"},l={unversionedId:"getting-started",id:"getting-started",isDocsHomePage:!1,title:"Getting started",description:"To get started with bangle.dev you need to install the core module:",source:"@site/docs/getting-started.md",slug:"/getting-started",permalink:"/docs/getting-started",editUrl:"https://github.com/bangle-io/bangle.dev/edit/master/_bangle-website/docs/getting-started.md",version:"current",sidebar_label:"Getting Started",sidebar:"docs",previous:{title:"Hello",permalink:"/docs/"},next:{title:"Markdown",permalink:"/docs/examples/markdown-editor"}},c=[{value:"With React",id:"with-react",children:[]},{value:"Build tools",id:"build-tools",children:[]},{value:"Stability",id:"stability",children:[]},{value:"The Bangle eco-system",id:"the-bangle-eco-system",children:[]}],b={rightToc:c};function p(e){var t=e.components,n=Object(r.a)(e,["components"]);return Object(i.b)("wrapper",Object(a.a)({},b,n,{components:t,mdxType:"MDXLayout"}),Object(i.b)("p",null,"To get started with bangle.dev you need to install the core module:"),Object(i.b)("pre",null,Object(i.b)("code",Object(a.a)({parentName:"pre"},{}),"npm install @bangle.dev/core\n")),Object(i.b)("h2",{id:"with-react"},"With React"),Object(i.b)("p",null,"Bangle at its heart is framework agnostic, but it comes with first party support for React. To get started, run the follow command:"),Object(i.b)("pre",null,Object(i.b)("code",Object(a.a)({parentName:"pre"},{}),"npm install @bangle.dev/react\n")),Object(i.b)("h2",{id:"build-tools"},"Build tools"),Object(i.b)("p",null,"I have setup a repo to showcase how to use Bangle.dev with various contemporary bundlers. Lets be honest, frontend setup is a nightmare \ud83e\udddf\u200d\u2640\ufe0f and the last thing I want is someone fiddling with Webpack or Babel config:"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},Object(i.b)("a",Object(a.a)({parentName:"li"},{href:"https://github.com/bangle-io/bangle.dev-boilerplates/tree/main/create-react-app-v4"}),"create-react-app-v4")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("a",Object(a.a)({parentName:"li"},{href:"https://github.com/bangle-io/bangle.dev-boilerplates/tree/main/create-react-app-v3"}),"create-react-app-v3")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("a",Object(a.a)({parentName:"li"},{href:"https://github.com/bangle-io/bangle.dev-boilerplates/tree/main/webpack-v4"}),"webpack-v4"))),Object(i.b)("p",null,"Feel free to send a Pull Request for your favorite build tool. If setup looks good, head over to the ",Object(i.b)("a",Object(a.a)({parentName:"p"},{href:"https://bangle.dev/docs/examples/markdown-editor"}),"examples"),"!"),Object(i.b)("p",null,"\u2764\ufe0f Support for ",Object(i.b)("strong",{parentName:"p"},"Vue")," is coming soon. Meanwhile you can either use vanilla Bangle Components ",Object(i.b)("em",{parentName:"p"},"or")," consider ",Object(i.b)("a",Object(a.a)({parentName:"p"},{href:"https://github.com/ueberdosis/tiptap"}),"tiptap")," an awesome library which runs the same ",Object(i.b)("a",Object(a.a)({parentName:"p"},{href:"https://prosemirror.net"}),"Prosemirror")," blood in its veins!"),Object(i.b)("h2",{id:"stability"},"Stability"),Object(i.b)("p",null,Object(i.b)("strong",{parentName:"p"},"Current"),":"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},"Bangle is currently in ",Object(i.b)("inlineCode",{parentName:"li"},"beta")," phase and we plan to iterate fast, bug fixes and many breaking changes. I would request you to try it out and use it in your side projects but avoid using it in ",Object(i.b)("strong",{parentName:"li"},"production"),".")),Object(i.b)("h2",{id:"the-bangle-eco-system"},"The Bangle eco-system"),Object(i.b)("p",null,"The Bangle project is made up of smaller individual packages to fit a particular scoped need. You can find their documentation under the API section of the sidebar. Please keep the following things in mind when consuming any of the Bangle packages:"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},Object(i.b)("p",{parentName:"li"},"Only the packages with names starting ",Object(i.b)("inlineCode",{parentName:"p"},"@bangle.dev/react-")," require a React dependency.")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("p",{parentName:"li"},"Certain packages have a peer dependency on other Bangle packages, your package manager should help you install them.")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("p",{parentName:"li"},"If a package has a stylesheet, it will always under a file named ",Object(i.b)("inlineCode",{parentName:"p"},"style.css")," and can be imported by doing ",Object(i.b)("inlineCode",{parentName:"p"},"import @bangle.dev/xyz-module/style.css"),"."))))}p.isMDXComponent=!0},154:function(e,t,n){"use strict";n.d(t,"a",(function(){return s})),n.d(t,"b",(function(){return m}));var a=n(0),r=n.n(a);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var b=r.a.createContext({}),p=function(e){var t=r.a.useContext(b),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},s=function(e){var t=p(e.components);return r.a.createElement(b.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.a.createElement(r.a.Fragment,{},t)}},d=r.a.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,o=e.parentName,b=c(e,["components","mdxType","originalType","parentName"]),s=p(n),d=a,m=s["".concat(o,".").concat(d)]||s[d]||u[d]||i;return n?r.a.createElement(m,l(l({ref:t},b),{},{components:n})):r.a.createElement(m,l({ref:t},b))}));function m(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,o=new Array(i);o[0]=d;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:a,o[1]=l;for(var b=2;b<i;b++)o[b]=n[b];return r.a.createElement.apply(null,o)}return r.a.createElement.apply(null,n)}d.displayName="MDXCreateElement"}}]);
import React from 'react';
import { Plugin } from 'prosemirror-state';

export class ReactPMPlugin extends React.PureComponent {
  constructor(props) {
    super(props);
    props.addPlugins(() => {
      return;
    });
  }
}

class RPlugin extends Plugin {
  getReactElement(state) {
    // return
  }
}

class RenderProps {}

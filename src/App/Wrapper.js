import React from 'react';
import { createPortal } from 'react-dom';
import { pure } from 'recompose';

export function WrapperFoo(Comp) {
  return class Wrapper extends React.Component {
    shouldComponentUpdate(nextProps) {
      return this.props.updateKey !== nextProps.updateKey;
    }
    render() {
      const { updateKey, ...props } = this.props;
      return <Comp {...props} />;
    }
  };
}

export class GrouperComp extends React.PureComponent {
  keyMap = new WeakMap();
  render() {
    // console.log('rendering', this.props.name, this.props.uid);
    return Array.from(this.props.elements).map(([dom, [ReactComp, props]]) => {
      let key = this.keyMap.get(dom);
      if (!key) {
        key = Math.random() + '';
        this.keyMap.set(dom, key);
      }
      return createPortal(
        <ReactComp {...props} />,
        dom,
        key, // I have verified adding a stable key does improve performance by reducing re-renders
      );
    });
  }
}

import React from 'react';
import { NodeView, serializationHelpers } from 'bangle-core/node-view';
import reactDOM from 'react-dom';
import { createElement } from 'bangle-core/utils/js-utils';
import { Plugin } from 'prosemirror-state';

export class Banana extends React.Component {
  render() {
    const props = this.props;
    const attrs = props.node.attrs;
    return (
      <div>
        I am {attrs['data-ripe']} {attrs['color']} banana
      </div>
    );
  }
}

export function bananaComponent(testId) {
  const name = 'banana';
  return {
    spec() {
      const spec = {
        type: 'node',
        name,
        schema: {
          attrs: {
            'data-ripe': {
              default: 'fresh',
            },
            'color': {
              default: 'yellow',
            },
          },
          inline: true,
          group: 'inline',
          draggable: true,
        },
        nodeView2: (node, view, getPos, decorations) => {
          const containerDOM = document.createElement('span');
          const reactContainerDOM = document.createElement('span');
          containerDOM.appendChild(reactContainerDOM);
          reactContainerDOM.setAttribute('data-testid', testId);

          return new NodeView({
            node,
            view,
            getPos,
            decorations,
            containerDOM,
            update({ node, view, getPos, decorations, selected }) {
              reactDOM.render(
                <Banana view={view} selected={selected} node={node} />,
                reactContainerDOM,
              );
            },
            destroy() {
              reactDOM.unmountComponentAtNode(reactContainerDOM);
              containerDOM.removeChild(reactContainerDOM);
            },
          });
        },
      };

      spec.schema = { ...spec.schema, ...serializationHelpers(spec) };
      return spec;
    },
    plugins: () => {
      return new Plugin({
        props: {
          nodeViews: {
            [name]: (node, view, getPos, decorations) => {
              const containerDOM = createElement('span', {});
              const mountDOM = createElement('span', {
                'data-testid': testId,
                'data-mount': 'true',
              });
              containerDOM.appendChild(mountDOM);

              return new NodeView({
                node,
                view,
                getPos,
                decorations,
                containerDOM,
                mountDOM: mountDOM,
              });
            },
          },
        },
      });
    },
  };
}

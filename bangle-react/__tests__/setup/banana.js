import React from 'react';
import { NodeView, serializationHelpers } from 'bangle-core/node-view';

export class Banana extends React.Component {
  render() {
    const { attrs, updateAttrs } = this.props;

    return (
      <div
        data-color={attrs['color']}
        onClick={() => {
          updateAttrs({ ripe: 'stale' });
        }}
      >{`I am ${attrs['ripe']} ${attrs['color']} banana`}</div>
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
            ripe: {
              default: 'fresh',
            },
            color: {
              default: 'yellow',
            },
          },
          inline: true,
          group: 'inline',
          draggable: true,
        },
      };

      spec.schema = { ...spec.schema, ...serializationHelpers(spec) };
      return spec;
    },
    plugins: () => {
      return NodeView.createPlugin({
        name,
        containerDOM: [
          'span',
          { 'data-testid': testId, 'data-bangle-container': '' },
        ],
      });
    },
  };
}

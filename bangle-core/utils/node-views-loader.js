import { CustomNodeView } from 'bangle-core/helper-react/custom-node-view';

export function nodeViewsLoader(specSheet, renderNodeView, destroyNodeView) {
  return Object.fromEntries(
    specSheet.spec
      .filter((s) => s.type === 'node' && s.nodeView)
      .map((spec) => {
        return [
          spec.name,
          (node, view, getPos, decorations) => {
            return new CustomNodeView({
              node,
              view,
              getPos,
              decorations,
              spec,
              renderNodeView,
              destroyNodeView,
            });
          },
        ];
      }),
  );
}

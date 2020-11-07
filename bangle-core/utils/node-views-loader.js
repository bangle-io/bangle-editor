import { CustomNodeView } from 'bangle-core/helper-react/custom-node-view';

export function nodeViewsLoader(specSheet, renderNodeView, destroyNodeView) {
  return Object.fromEntries(
    specSheet.spec
      .filter((s) => s.type === 'node' && (s.nodeView || s.nodeView2))
      .map((spec) => {
        return [
          spec.name,
          spec.nodeView2
            ? spec.nodeView2
            : (node, view, getPos, decorations) => {
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

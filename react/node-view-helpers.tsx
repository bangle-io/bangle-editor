import { NodeView, RenderHandlers, saveRenderHandlers } from '@bangle.dev/core';
import { objectUid } from '@bangle.dev/js-utils';
import { RefObject, useEffect, useState } from 'react';

const LOG = false;

let log = LOG ? console.log.bind(console, 'node-view-helpers') : () => {};

export const nodeViewUpdateStore = new WeakMap();

type NodeViewsUpdater = (nodeViewUpdateStore: NodeView[]) => NodeView[];
type UpdateNodeViewsFunction = (updater: NodeViewsUpdater) => void;

export const nodeViewRenderHandlers = (
  updateNodeViews: UpdateNodeViewsFunction,
): RenderHandlers => ({
  create: (nodeView, _nodeViewProps) => {
    log('create', objectUid.get(nodeView));
    updateNodeViews((nodeViews) => [...nodeViews, nodeView]);
  },
  update: (nodeView, _nodeViewProps) => {
    log('update', objectUid.get(nodeView));
    const updateCallback = nodeViewUpdateStore.get(nodeView);
    // If updateCallback is undefined (which can happen if react took long to mount),
    // we are still okay, as the latest nodeViewProps will be accessed whenever it mounts.
    if (updateCallback) {
      updateCallback();
    }
  },
  destroy: (nodeView) => {
    log('destroy', objectUid.get(nodeView));
    updateNodeViews((nodeViews) => nodeViews.filter((n) => n !== nodeView));
  },
});

export function useNodeViews(ref: RefObject<HTMLElement>) {
  const [nodeViews, setNodeViews] = useState<NodeView[]>([]);
  useEffect(() => {
    // save the renderHandlers in the dom to decouple nodeView instantiating code
    // from the editor. Since PM passing view when nodeView is created, the author
    // of the component can get the handler reference from `getRenderHandlers(view)`.
    // Note: this assumes that the pm's dom is the direct child of `editorRenderTarget`.
    let destroyed = false;
    saveRenderHandlers(
      ref.current!,
      nodeViewRenderHandlers((cb) => {
        if (!destroyed) {
          // use callback variant of setState to
          // always get freshest nodeViews.
          setNodeViews((nodeViews) => cb(nodeViews));
        }
      }),
    );
    return () => {
      destroyed = true;
    };
  }, [ref]);

  return nodeViews;
}

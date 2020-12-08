import { objUid } from '@banglejs/core/utils/object-uid';

const LOG = false;

let log = LOG ? console.log.bind(console, 'node-view-helpers') : () => {};

export const nodeViewUpdateStore = new WeakMap();

export const nodeViewRenderHandlers = (updateNodeViews) => ({
  create: (nodeView, nodeViewProps) => {
    log('create', objUid.get(nodeView));
    updateNodeViews((nodeViews) => [...nodeViews, nodeView]);
  },
  update: (nodeView, nodeViewProps) => {
    log('update', objUid.get(nodeView));
    const updateCallback = nodeViewUpdateStore.get(nodeView);
    // If updateCallback is undefined (which can happen if react took long to mount),
    // we are still okay, as the latest nodeViewProps will be accessed whenever it mounts.
    if (updateCallback) {
      updateCallback();
    }
  },
  destroy: (nodeView) => {
    log('destroy', objUid.get(nodeView));
    updateNodeViews((nodeViews) => nodeViews.filter((n) => n !== nodeView));
  },
});

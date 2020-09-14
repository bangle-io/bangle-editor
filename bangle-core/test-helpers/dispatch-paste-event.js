import browser from 'bangle-core/utils/browser';
import { createEvent } from './create-event';

/**
 *
 *
 * Dispatch a paste event on the given ProseMirror instance
 *
 * Usage:
 *     dispatchPasteEvent(pm, {
 *         plain: 'copied text'
 *     });
 */
export function dispatchPasteEvent(editorView, content) {
  const event = createEvent('paste');
  const clipboardData = {
    getData(type) {
      if (type === 'text/plain') {
        return content.plain;
      }
      if (type === 'text/html') {
        return content.html;
      }
      if (type === 'text/uri-list') {
        return content['uri-list'];
      }
      return;
    },
    types: content.types || [],
    files: content.files || [],
    items: content.items || null,
  };
  // Reason: https://github.com/ProseMirror/prosemirror-view/blob/9d2295d03c2d17357213371e4d083f0213441a7e/bangle-play/input.js#L379-L384
  if ((browser.ie && browser.ie_version < 15) || browser.ios) {
    return false;
  }
  Object.defineProperty(event, 'clipboardData', { value: clipboardData });

  editorView.dispatchEvent(event);
  return event;
}

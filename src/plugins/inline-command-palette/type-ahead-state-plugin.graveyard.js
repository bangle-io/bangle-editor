// import { Plugin, PluginKey } from 'prosemirror-state';

// import { isQueryActive, findTypeAheadQuery } from './helpers/query';
// import { removeTypeAheadMark } from './commands';
// import * as actions from './actions';

// export const typeAheadStatePluginKey = new PluginKey('typeahead-state-plugin');

// const initialState = {
//   active: false,
//   query: null,
//   queryMarkPos: null,
//   index: 0,
// };

// export function typeAheadStatePlugin() {
//   return new Plugin({
//     key: typeAheadStatePluginKey,
//     state: {
//       init: () => initialState,
//       apply(tr, pluginState, oldEditorState, newEditorState) {
//         const meta = tr.getMeta(typeAheadStatePluginKey) || {};
//         const { action } = meta;
//         switch (action) {
//           case actions.SELECT_INDEX: {
//             return {
//               ...pluginState,
//               active: false,
//             };
//           }
//           case actions.INCREMENT_INDEX: {
//             return {
//               ...pluginState,
//               index: pluginState.index + 1,
//             };
//           }
//           case actions.DECREMENT_INDEX: {
//             return {
//               ...pluginState,
//               index: pluginState.index - 1,
//             };
//           }
//           default: {
//             return defaultActionHandler(newEditorState, pluginState);
//           }
//         }
//       },
//     },
//     view() {
//       return {
//         update: (editorView, prevEditorState) => {
//           const pluginState = this.key.getState(editorView.state);
//           if (!pluginState.active) {
//             removeTypeAheadMark()(editorView.state, editorView.dispatch);
//             return;
//           }
//         },
//       };
//     },
//   });
// }

// export function defaultActionHandler(editorState, pluginState) {
//   const { typeAheadQuery } = editorState.schema.marks;
//   const { doc, selection } = editorState;
//   const { from, to } = selection;
//   const isActive = isQueryActive(typeAheadQuery, doc, from - 1, to);

//   const { nodeBefore } = selection.$from;

//   if (!isActive || !nodeBefore) {
//     return initialState;
//   }

//   const typeAheadMark = typeAheadQuery.isInSet(nodeBefore.marks || []);
//   const textContent = nodeBefore.textContent || '';
//   const trigger = typeAheadMark.attrs.trigger;
//   const query = textContent
//     // eslint-disable-next-line no-control-regex
//     .replace(/^([^\x00-\xFF]|[\s\n])+/g, '')
//     .replace(trigger, '');

//   const queryMark = findTypeAheadQuery(editorState);
//   return {
//     ...pluginState,
//     active: isActive,
//     query,
//     queryMarkPos: queryMark !== null ? queryMark.start : null,
//   };
// }

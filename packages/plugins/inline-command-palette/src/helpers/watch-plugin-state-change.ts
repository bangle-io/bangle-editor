import { Plugin, EditorState, PluginKey } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';

type Type<PState, S extends Schema = any> = {
  plugin: Plugin<PState, S>;
  pluginKey: PluginKey<PState, S>;
  onStateInit: (a: PState) => void;
  onStateApply: (o: { prev: PState; cur: PState }) => void;
};

export function watchStateChange<PState, S extends Schema = any>({
  plugin,
  pluginKey,
  onStateInit,
  onStateApply
}: Type<PState, S>): [Plugin<PState, S>, Plugin] {
  // The ordering is important or else we would get incorrect data
  return [
    plugin,
    new Plugin({
      state: {
        init(_, instance) {
          onStateInit && onStateInit(pluginKey.getState(instance));
          return;
        },
        apply(tr, value, oldState: EditorState, newState: EditorState) {
          if (!onStateApply) {
            return;
          }
          const prev = pluginKey.getState(oldState);
          const cur = pluginKey.getState(newState);

          if (prev !== cur) {
            onStateApply({
              prev: pluginKey.getState(oldState),
              cur: pluginKey.getState(newState)
            });
          }
          return;
        }
      }
    })
  ];
}

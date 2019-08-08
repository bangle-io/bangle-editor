import { Plugin, EditorState, PluginKey, PluginSpec } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';

type Type<PState, S extends Schema = any> = {
  plugin: Plugin<PState, S>;
  onStateChange: (o: {
    prev: PState | undefined;
    cur: PState | undefined;
  }) => void;
};

export function watchStateChange<PState, S extends Schema = any>({
  plugin,
  onStateChange,
}: Type<PState, S>): [Plugin<PState, S>, Plugin] {
  // The ordering is important or else we would get incorrect data
  return [
    plugin,
    new Plugin({
      state: {
        init(_, instance) {
          onStateChange({ prev: undefined, cur: plugin.getState(instance) });
          return;
        },
        apply(tr, value, oldState: EditorState, newState: EditorState) {
          const prev = plugin.getState(oldState);
          const cur = plugin.getState(newState);

          if (prev !== cur) {
            onStateChange({
              prev: plugin.getState(oldState),
              cur: plugin.getState(newState),
            });
          }
          return;
        },
      },
    }),
  ];
}

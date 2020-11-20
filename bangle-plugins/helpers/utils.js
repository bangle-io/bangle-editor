import { bangleWarn } from 'bangle-core/utils/js-utils';
import { PluginKey } from 'prosemirror-state';

export function pluginKeyStore() {
  const store = new WeakMap();
  return {
    get(parentKey, childKeyId) {
      validPluginKey(parentKey);
      const family = store.get(parentKey);
      if (!family || !family[childKeyId] || !childKeyId) {
        bangleWarn(
          `There is no key named ${childKeyId} associated with the pluginKey =`,
          parentKey,
          `\nPlease make sure you are passing the pluginKey correctly to your components.`,
        );

        throw new Error(`Cannot find the pluginKey '${childKeyId}'`);
      }

      return store.get(parentKey)[childKeyId];
    },

    create(parentKey, childKeyId) {
      validPluginKey(parentKey);
      const key = new PluginKey(childKeyId);
      if (store.has(parentKey)) {
        const children = store.get(parentKey);
        if (children[childKeyId]) {
          bangleWarn(
            `There is already a key ${childKeyId} associated with the pluginKey =`,
            parentKey,
          );

          throw new Error(
            `Parent is already associated with key'${childKeyId}'`,
          );
        }
        children[childKeyId] = key;
      } else {
        store.set(parentKey, { [childKeyId]: key });
      }
      return key;
    },
  };
}

function validPluginKey(key) {
  if (!(key instanceof PluginKey)) {
    bangleWarn('The key is not a valid pluginKey', key);
    throw new Error(`Please pass a valid plugin key`);
  }
}

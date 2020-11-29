import { bangleWarn } from 'bangle-core/utils/js-utils';
import { PluginKey } from '../pm-plugin';

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
        // This situation might arise when a new view
        // is created or just calling the 'create' without worry.
        // Returning a pre-existing key is okay, because
        // you need a view.state + key to get the correct plugin store.
        // Hence, using the same key for multiple views is totally fine.
        if (children[childKeyId]) {
          return children[childKeyId];
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

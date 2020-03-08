import localforage from 'localforage';

localforage.config({
  name: 'bangle/1',
  version: 1.0,
});

async function getSavedData(result = new Map()) {
  const existingKeys = await localforage.keys();
  for (const uid of existingKeys.filter((uid) => !result.has(uid))) {
    let item = await localforage.getItem(uid);
    let payload = item;
    if (typeof item === 'string') {
      payload = JSON.parse(item);
    }

    if (!payload.uid) {
      continue;
    }

    result.set(uid, payload);
  }

  return result;
}

export class LocalManager {
  _entries = new Map();

  constructor() {
    this.refreshEntries();
  }

  async lastModifiedEntry() {
    await this.refreshEntries();

    const [first] = [...this._entries.values()].sort((a, b) => {
      return b.modified - a.modified;
    });

    return first;
  }

  get entries() {
    return [...this._entries.values()];
  }

  async refreshEntries() {
    this._entries = await getSavedData(this._entries);
    console.log('refreshEntries', this._entries);
  }

  async saveEntry(entry) {
    entry = this._makeEntry({ ...entry, modified: undefined });
    await this._persist(entry);
    return entry;
  }

  async removeEntry(entry) {
    await localforage.removeItem(entry.uid);
    this._entries.delete(entry.uid);
  }

  async _persist(entry) {
    this._entries.set(entry.uid, entry);
    await localforage.setItem(entry.uid, entry);
  }

  _makeEntry({
    uid = makeId(6),
    content = 'dump',
    title = uid,
    created = new Date().getTime(),
    modified = new Date().getTime(),
  }) {
    return {
      uid,
      title,
      content,
      created,
      modified,
    };
  }
}

export const localManager = new LocalManager();

function makeId(length) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

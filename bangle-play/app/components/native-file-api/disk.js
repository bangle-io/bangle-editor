import { markdownParser } from 'bangle-plugins/markdown/markdown-parser';
import { Disk } from 'bangle-plugins/persistence/disk';
import localforage from 'localforage';
import {
  pickADirectory,
  recurseDirHandle,
  readFile,
  iterateIndexDb,
} from './helper';

export const indexDb = localforage.createInstance({
  name: 'native-file/2',
});

export class NativeFileDb {
  /**
   * @returns {Array<{workspaceName: string, handle: Object}>}
   */
  static async listExistingWorkspaces() {
    const results = await iterateIndexDb(indexDb);
    return results.map(({ key, value }) => ({
      workspaceName: key,
      handle: value,
    }));
  }

  static async openWorkspace(schema, workspaceName) {
    let workspace = await indexDb.getItem(workspaceName);

    const dirHandle = await pickADirectory(indexDb, workspace?.handle);

    await indexDb.setItem(dirHandle.name, {
      opened: Date.now(),
      handle: dirHandle,
    });

    const filePathHandles = await recurseDirHandle(dirHandle, {
      allowedFile: (entry) => entry.name.endsWith('.md'),
    });

    return new NativeFileDb(dirHandle, filePathHandles, schema);
  }

  _isReady = false;
  _filePathHandles = null;
  _workspaceDirHandle = null;
  _schema = null;
  _entryPathToName = (entryPath) => {
    return entryPath.map((r) => r.name).join('/');
  };

  constructor(workspaceDirHandle, filePathHandles, schema) {
    this._workspaceDirHandle = workspaceDirHandle;
    this._schema = schema;

    this._filePathHandles = filePathHandles;
  }

  async getDoc(name) {
    if (!this._isReady) {
      throw new Error('not read');
    }
    const path = this._filePathHandles.find((entryPath) => {
      return name === this._entryPathToName(entryPath);
    });

    if (!path) {
      // todo create it
      throw new Error('not implement ' + name);
    }
    const textContent = await readFile(path[path.length - 1]);
    const doc = await markdownParser(this._schema).parse(textContent);
    return doc;
  }
}

async function iterateToAsync(indexDb) {
  const items = await new Promise((res) => {
    let result = [];
    indexDb
      .iterate((value, key, iterationNumber) => {
        result.push([key, value]);
      })
      .then(() => {
        res(result);
      });
  });
  return items;
}

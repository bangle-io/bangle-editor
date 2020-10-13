import { getIdleCallback, uuid } from 'bangle-core/utils/js-utils';
import localforage from 'localforage';
import { Workspace } from './workspace';
import { IndexDbWorkspaceFile } from './workspace-file';
const LOG = true;

let log = LOG ? console.log.bind(console, 'play/idb-workspace') : () => {};

export const TYPE_INDEXDB = 'indexdb';
const createIndexdbUid = () => TYPE_INDEXDB + '_' + uuid(6);

export class IndexDbWorkspace extends Workspace {
  static getDbInstance = async (uid, metadata, schema) => {
    if (!metadata) {
      throw new Error('metadata needed');
    }
    if (!schema) {
      throw new Error('schema needed');
    }

    return localforage.createInstance({
      name: uid,
    });
  };

  static async restoreWorkspaceFromBackupFile(data, schema) {
    const uid = createIndexdbUid();
    const dbInstance = await IndexDbWorkspace.getDbInstance(uid, {}, schema);

    let { name, files, metadata } = data;

    const type = TYPE_INDEXDB;

    // old style backup
    if (Array.isArray(data)) {
      name = 'pyare-mohan' + Math.floor(100 * Math.random());
      files = await Promise.all(
        data.map((item) =>
          IndexDbWorkspaceFile.fromJSON(item, { schema, dbInstance }),
        ),
      );
      metadata = {};
    } else {
      files = await Promise.all(
        files.map((item) =>
          IndexDbWorkspaceFile.fromJSON(item, { schema, dbInstance }),
        ),
      );
    }

    const opts = {
      dbInstance,
      schema,
      metadata,
      name,
    };

    const instance = new IndexDbWorkspace(uid, files, type, opts);
    await instance.persistWorkspaceInfo();
    return instance;
  }

  static async openWorkspace(uid, name, schema, metadata = {}) {
    const dbInstance = await IndexDbWorkspace.getDbInstance(
      uid,
      metadata,
      schema,
    );
    const opts = {
      name,
      dbInstance,
      schema,
      metadata,
    };
    let files = await IndexDbWorkspaceFile.getAllFilesInDb(opts);
    const instance = new IndexDbWorkspace(uid, files, TYPE_INDEXDB, opts);
    await instance.persistWorkspaceInfo();
    return instance;
  }

  static openExistingWorkspace(workspaceInfo, schema) {
    const { uid, name, metadata } = workspaceInfo;

    return IndexDbWorkspace.openWorkspace(uid, name, schema, metadata);
  }

  static async createWorkspace(name, schema) {
    const uid = createIndexdbUid();
    return IndexDbWorkspace.openWorkspace(uid, name, schema);
  }

  updateFiles(files) {
    return new IndexDbWorkspace(this.uid, files, this.type, this._opts);
  }

  /**
   * TODO remove this, no need to put it in here
   */
  async createFile(docName, doc) {
    return IndexDbWorkspaceFile.createFile(docName, doc, undefined, this._opts);
  }

  async deleteWorkspace() {
    if (this.deleted) {
      return;
    }

    super.deleteWorkspace();
    let files = await IndexDbWorkspaceFile.getAllFilesInDb(this._opts);
    files.forEach((value) => {
      value.delete();
    });
    getIdleCallback(() => {
      localforage.dropInstance({ name: this.uid });
    });
  }
}

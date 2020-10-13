import { getIdleCallback, uuid } from 'bangle-core/utils/js-utils';
import localforage from 'localforage';
import { FSStorage } from './native-fs-driver';
import { Workspace } from './workspace';
import { IndexDbWorkspaceFile } from './workspace-file';
const LOG = true;

let log = LOG ? console.log.bind(console, 'play/idb-workspace') : () => {};

export const INDEXDB_TYPE = 'indexdb';
export const NATIVE_FS_TYPE = 'native';
const createIndexdbUid = () => {
  return INDEXDB_TYPE + '_' + uuid(6);
};
const createNativeUid = () => {
  return NATIVE_FS_TYPE + '_' + uuid(6);
};
const createUid = (type) => {
  switch (type) {
    case NATIVE_FS_TYPE:
      return createNativeUid();
    case INDEXDB_TYPE:
      return createIndexdbUid();
    default:
      throw new Error('Unknown type ' + type);
  }
};

const getType = (uid) => {
  if (uid.startsWith(INDEXDB_TYPE + '_')) {
    return INDEXDB_TYPE;
  }
  if (uid.startsWith(NATIVE_FS_TYPE + '_')) {
    return NATIVE_FS_TYPE;
  }
  throw new Error('Unknown type ' + uid);
};

export class IndexDbWorkspace extends Workspace {
  static getDbInstance = async (uid, metadata, schema) => {
    if (!metadata) {
      throw new Error('metadata needed');
    }
    if (!schema) {
      throw new Error('schema needed');
    }

    if (uid.startsWith(NATIVE_FS_TYPE)) {
      return FSStorage.createInstance(metadata.dirHandle, schema);
    }

    return localforage.createInstance({
      name: uid,
    });
  };

  static async restoreWorkspaceFromBackupFile(data, schema, type) {
    const uid = createUid(type);
    const dbInstance = await IndexDbWorkspace.getDbInstance(uid, {}, schema);

    let { name, files, metadata } = data;

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
    const instance = new IndexDbWorkspace(uid, files, getType(uid), opts);
    await instance.persistWorkspaceInfo();
    return instance;
  }

  static openExistingWorkspace(workspaceInfo, schema) {
    const { uid, name, metadata } = workspaceInfo;

    return IndexDbWorkspace.openWorkspace(uid, name, schema, metadata);
  }

  static async createWorkspace(name, schema, type) {
    const uid = createUid(type);
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
    // TODO implement this for nativefs
    getIdleCallback(() => {
      localforage.dropInstance({ name: this.uid });
    });
  }
}

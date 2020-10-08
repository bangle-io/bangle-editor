import { getIdleCallback, uuid } from 'bangle-core/utils/js-utils';
import localforage from 'localforage';
import { downloadJSON } from '../misc/index';

import { IndexDbWorkspaceFile } from './workspace-file';
const LOG = true;

let log = LOG ? console.log.bind(console, 'play/workspace') : () => {};

// TODO if a file fails to open for whatever reason donot fail
// allow user to open another file
export class Workspace {
  static async listWorkspaces() {
    const instance = localforage.createInstance({
      name: 'workspaces/1',
    });
    let existing = await instance.getItem('workspaces');
    if (!existing || !existing[0]) {
      return [];
    }
    existing = existing.map((e) => {
      if (e.uid === this.uid) {
        return { ...e, modified: this.modified };
      }
      return e;
    });

    return existing.sort((a, b) => b.modified - a.modified);
  }
  /**
   * @type {WorkspaceFile[]}
   */
  files;

  static validateOpts = (opts) => {
    if (!opts.name) {
      throw new Error(`Opts name is required`);
    }
    if (!opts.schema) {
      throw new Error(`Opts schema is required`);
    }
    if (!opts.metadata) {
      throw new Error(`Opts metadata is required`);
    }
  };

  constructor(uid, files, type, opts) {
    Workspace.validateOpts(opts);

    this.uid = uid;
    this.type = type;
    this._opts = opts;
    this.deleted = false;
    this.files = files.sort((a, b) => a.docName.localeCompare(b.docName));
    const { name, metadata } = opts;

    this.name = name;
    this.metadata = metadata;
    this.modified = Date.now();
  }

  createNew(...args) {
    throw new Error('Implement');
  }

  toJSON() {
    return {
      name: this.name,
      files: this.files.map((f) => f.toJSON()),
      metadata: this.metadata,
      type: this.type,
    };
  }

  async persistWorkspace() {
    if (this.deleted) {
      return;
    }

    const instance = localforage.createInstance({
      name: 'workspaces/1',
    });
    let existing = await instance.getItem('workspaces');
    if (!existing) {
      existing = [];
    }
    const { name, type, uid } = this;

    let entry = existing.find((w) => w.uid === this.uid);

    if (entry) {
      entry.modified = this.modified;
      entry.name = name;
    } else {
      existing.push({
        uid,
        name: name,
        type: type,
        created: this.modified,
        modified: this.modified,
      });
    }

    await instance.setItem('workspaces', existing);
  }

  async deleteWorkspace() {
    if (this.deleted) {
      return;
    }

    const instance = localforage.createInstance({
      name: 'workspaces/1',
    });

    let existing = await instance.getItem('workspaces');

    if (!existing) {
      return;
    }

    existing = existing.filter((w) => !(w.uid === this.uid));
    await instance.setItem('workspaces', existing);
    this.deleted = true;
  }

  async rename(newName) {
    if (!newName || typeof newName !== 'string') {
      return this;
    }

    this.name = newName;
    await this.persistWorkspace();
    return this;
  }

  getFile(docName) {
    return this.files.find((file) => file.docName === docName);
  }

  hasFile(docName) {
    return Boolean(this.getFile(docName));
  }

  linkFile(file) {
    return this.createNew(
      this.name,
      [...this.files, file],
      this.type,
      this._opts,
    );
  }

  unlinkFile(file) {
    return this.createNew(
      this.name,
      this.files.filter((f) => f.docName !== file.docName),
      this.type,
      this._opts,
    );
  }

  downloadBackup() {
    const data = this.toJSON();
    downloadJSON(data, `${this.name}_${this.uid}.json`);
  }
}

export class IndexDbWorkspace extends Workspace {
  static getDbInstance = (uid) => {
    return localforage.createInstance({
      name: uid,
    });
  };

  static async restoreWorkspaceFromBackupFile(data, schema) {
    const uid = uuid(6);
    const dbInstance = IndexDbWorkspace.getDbInstance(uid);

    let { name, files, metadata, type } = data;

    // old style backup
    if (Array.isArray(data)) {
      name = 'pyare-mohan' + Math.floor(100 * Math.random());
      files = await Promise.all(
        data.map((item) =>
          IndexDbWorkspaceFile.fromJSON(item, { schema, dbInstance }),
        ),
      );
      type = 'indexdb';
      metadata = {};
    } else {
      files = await Promise.all(
        files.map((item) =>
          IndexDbWorkspaceFile.fromJSON(item, { schema, dbInstance }),
        ),
      );
    }

    if (type !== 'indexdb') {
      throw new Error('Cant handle other tpe');
    }

    const opts = {
      dbInstance,
      schema,
      metadata,
      name,
    };

    const instance = new IndexDbWorkspace(uid, files, type, opts);
    await instance.persistWorkspace();
    return instance;
  }

  static async openWorkspace(uid, name, schema) {
    const dbInstance = IndexDbWorkspace.getDbInstance(uid);
    const opts = {
      name,
      dbInstance,
      schema,
      metadata: {},
    };
    let files = await IndexDbWorkspaceFile.getAllFilesInDb(opts);
    const instance = new IndexDbWorkspace(uid, files, 'indexdb', opts);
    await instance.persistWorkspace();
    return instance;
  }

  static async openExistingWorkspace(uid, schema) {
    const availableWorkspaces = await Workspace.listWorkspaces();
    const entry = availableWorkspaces.find((w) => w.uid === uid);
    if (!entry) {
      throw new Error(uid + ': Workspace not found');
    }
    if (entry.type !== 'indexdb') {
      throw new Error('Only indexdb');
    }

    return IndexDbWorkspace.openWorkspace(uid, entry.name, schema);
  }

  static async createWorkspace(name, schema) {
    const uid = uuid(6);
    return IndexDbWorkspace.openWorkspace(uid, name, schema);
  }

  createNew(uid, files, type, opts) {
    if (!opts.dbInstance) {
      throw new Error('DB instance missing');
    }
    return new IndexDbWorkspace(uid, files, type, opts);
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

import localforage from 'localforage';
import { downloadJSON } from '../misc/index';
const LOG = false;

let log = LOG ? console.log.bind(console, 'play/workspace') : () => {};

// TODO if a file fails to open for whatever reason donot fail
// allow user to open another file
export class Workspace {
  static async listWorkspacesInfo() {
    const instance = localforage.createInstance({
      name: 'workspaces/1',
    });
    let existing = await instance.getItem('workspaces');
    if (!existing || !existing[0]) {
      return [];
    }

    return existing.sort((a, b) => a.type.localeCompare(b.type));
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
    if (!uid.startsWith('indexdb_') && !uid.startsWith('native_')) {
      throw new Error('malformed uid');
    }
    Workspace.validateOpts(opts);

    this.uid = uid;
    this.type = type;
    this._opts = opts;
    this.deleted = false;
    this.files = files.sort((a, b) => a.docName.localeCompare(b.docName));
    const { name, metadata } = opts;

    this.name = name;
    this.metadata = metadata;
    this.metadata.modified = Date.now();
  }

  createNew(...args) {
    throw new Error('Implement');
  }

  toJSON() {
    return {
      name: this.name,
      files: this.files.map((f) => f.toJSON()),
      metadata: this.metadata,
    };
  }

  async persistWorkspaceInfo() {
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
    const { name, type, uid, metadata } = this;
    log({ name, type, uid });
    let entry = existing.find((w) => w.uid === this.uid);

    if (entry) {
      entry.metadata = this.metadata;
      entry.name = name;
    } else {
      existing.push({
        uid,
        name: name,
        type: type,
        metadata: metadata,
      });
    }
    log(existing);
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
    await this.persistWorkspaceInfo();
    return this;
  }

  getFile(docName) {
    return this.files.find((file) => file.docName === docName);
  }

  hasFile(docName) {
    return Boolean(this.getFile(docName));
  }

  linkFile(file) {
    return this.updateFiles([...this.files, file]);
  }

  unlinkFile(file) {
    return this.updateFiles(
      this.files.filter((f) => f.docName !== file.docName),
    );
  }

  downloadBackup() {
    const data = this.toJSON();
    downloadJSON(data, `${this.name}_${this.uid}.json`);
  }
}

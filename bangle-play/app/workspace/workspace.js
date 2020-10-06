import localforage from 'localforage';

import { IndexDbWorkspaceFile } from './workspace-file';
const LOG = false;

let log = LOG ? console.log.bind(console, 'play/workspace') : () => {};

// TODO if a file fails to open for whatever reason donot fail
// allow user to open another file
export class Workspace {
  /**
   * @type {WorkspaceFile[]}
   */
  files;

  constructor(name, files, type, opts) {
    this.name = name;
    this.type = type;
    this._opts = opts;
    if (!opts.schema) {
      throw new Error('Schema needed');
    }
    this.files = files.sort((a, b) => a.docName.localeCompare(b.docName));
  }

  async persistWorkspace() {
    const instance = localforage.createInstance({
      name: 'workspaces/1',
    });
    let existing = await instance.getItem('workspaces');
    if (!existing) {
      existing = [];
    }
    const { name, type } = this;

    if (existing.find((w) => w.name === name && w.type === type)) {
      return;
    }

    existing.push({
      name: name,
      type: type,
    });

    await instance.setItem('workspaces', existing);
  }

  async deleteWorkspace() {
    const instance = localforage.createInstance({
      name: 'workspaces/1',
    });
    let existing = await instance.getItem('workspaces');
    if (!existing) {
      return;
    }
    const { name, type } = this;

    existing = existing.filter((w) => !(w.name === name && w.type === type));
    await instance.setItem('workspaces', existing);
  }

  getFile(docName) {
    return this.files.find((file) => file.docName === docName);
  }

  hasFile(docName) {
    return Boolean(this.getFile(docName));
  }

  linkFile(file) {
    return new IndexDbWorkspace(this.name, [...this.files, file], this._opts);
  }

  unlinkFile(file) {
    return new IndexDbWorkspace(
      this.name,
      this.files.filter((f) => f.docName !== file.docName),
      this._opts,
    );
  }
}

export class IndexDbWorkspace extends Workspace {
  static async createWorkspace(name, opts) {
    let files = await IndexDbWorkspaceFile.getAllFilesInDb(opts);
    const instance = new IndexDbWorkspace(name, files, 'indexdb', opts);
    await instance.persistWorkspace();
    return instance;
  }

  /**
   *
   * @param {*} payload
   * @returns {Promise<IndexDbWorkspaceFile>}
   */
  async createFile(docName, doc) {
    return IndexDbWorkspaceFile.createFile(docName, doc, undefined, this._opts);
  }
}

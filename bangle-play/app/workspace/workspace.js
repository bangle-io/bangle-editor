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

  /**
   * @returns {Promise<WorkspaceFile[]>>}
   */

  constructor(name, files, opts) {
    this.name = name;
    this._opts = opts;
    if (!opts.schema) {
      throw new Error('Schema needed');
    }

    this.files = files.sort((a, b) => a.docName.localeCompare(b.docName));
  }

  /**
   * @returns {Promise<WorkspaceFile>} docName
   */
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
  static async create(name, opts) {
    let files = await IndexDbWorkspaceFile.getAllFilesInDb(opts);
    return new IndexDbWorkspace(name, files, opts);
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

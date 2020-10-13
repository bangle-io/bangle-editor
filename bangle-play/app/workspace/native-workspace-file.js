import { uuid } from 'bangle-core/utils/js-utils';
import { WorkspaceFile } from './workspace-file';

export class NativeWorkspaceFile extends WorkspaceFile {
  static validateOpts(opts) {
    if (!opts.dbInstance) {
      throw new Error('Db Instance not found');
    }
    if (!opts.schema) {
      throw new Error('Db Instance not found');
    }
  }

  static async fromJSON(data, opts) {
    NativeWorkspaceFile.validateOpts(opts);
    const { doc, docName, metadata } = data;
    if (!data.doc || !data.docName) {
      throw new Error('Doc and docName are necessary');
    }
    return NativeWorkspaceFile.createFile(docName, doc, metadata, opts);
  }

  static async openFile(docName, opts) {
    NativeWorkspaceFile.validateOpts(opts);

    const data = await opts.dbInstance.getItem(docName);
    if (data) {
      const { doc, ...metadata } = data;
      return new NativeWorkspaceFile(docName, doc, metadata, opts);
    }

    throw new Error('File not found');
  }

  static async getAllFilesInDb(opts) {
    NativeWorkspaceFile.validateOpts(opts);

    const dbInstance = opts.dbInstance;
    return iterateIndexDb(dbInstance).then((docNames) => {
      return Promise.all(
        docNames.map((docName) => NativeWorkspaceFile.openFile(docName, opts)),
      );
    });
  }

  static async createFile(suggestedDocName, doc, metadata, opts) {
    NativeWorkspaceFile.validateOpts(opts);

    const docName = opts.dbInstance.createNewItemKey(suggestedDocName);

    const data = await opts.dbInstance.getItem(docName);
    if (data) {
      throw new Error('File already exists');
    }

    const file = new NativeWorkspaceFile(docName, doc, metadata, opts);
    await file.updateDoc();
    return file;
  }

  _dbInstance = null;

  constructor(docName, doc, metadata, opts) {
    if (!docName.endsWith('.md')) {
      throw new Error('Only md files');
    }
    metadata = {
      created: Date.now(),
      ...metadata,
      modified: Date.now(),
    };

    super(docName, doc, metadata, opts);
    NativeWorkspaceFile.validateOpts(opts);
    this._dbInstance = opts.dbInstance;
  }

  async delete() {
    super.delete();
    await this._dbInstance.removeItem(this.docName);
  }

  async updateDoc(newDoc, metadata = {}) {
    if (this.deleted) {
      return;
    }

    if (newDoc) {
      this.doc = newDoc;
    }

    await this._dbInstance.setItem(this.docName, {
      doc: this.doc,
      docName: this.docName,
      metadata,
    });
  }
}

function iterateIndexDb(indexDbInstance) {
  const result = [];
  return indexDbInstance
    .iterate((value, key, iterationNumber) => {
      result.push(key);
    })
    .then(() => {
      return result;
    });
}

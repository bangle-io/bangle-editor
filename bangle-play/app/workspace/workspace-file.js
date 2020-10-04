export class WorkspaceFile {
  constructor(docName, doc, metadata = {}, opts) {
    if (!docName) {
      throw new Error('Docname needed');
    }

    if (doc === undefined) {
      throw new Error('Doc needed, though it can be null');
    }

    this._opts = opts;

    if (!opts.schema) {
      throw new Error('No schema');
    }

    this._schema = opts.schema;
    this.metadata = metadata;
    this.docName = docName;
    this.doc = doc;
    this.deleted = false;
  }

  toJSON() {
    return {
      ...this.metadata,
      _schema: 'schema',
      docName: this.docName,
      doc: this.doc,
      deleted: this.false,
    };
  }

  get title() {
    const letHydratedDoc =
      this.doc?.content && this._schema.nodeFromJSON(this.doc);
    return letHydratedDoc?.firstChild?.textContent || this.docName;
  }

  async updateDoc(doc) {}
}

export class IndexDbWorkspaceFile extends WorkspaceFile {
  static async iterateIndexDb(indexDbInstance) {
    const result = [];
    return indexDbInstance
      .iterate((value, key, iterationNumber) => {
        result.push(key);
      })
      .then(() => {
        return result;
      });
  }

  static async openFile(docName, opts) {
    const data = await opts.dbInstance.getItem(docName);
    if (data) {
      const { doc, ...metadata } = data;
      return new IndexDbWorkspaceFile(docName, doc, metadata, opts);
    }

    throw new Error('File not found');
  }

  static async getAllFilesInDb(opts) {
    const dbInstance = opts.dbInstance;
    return IndexDbWorkspaceFile.iterateIndexDb(dbInstance).then((docNames) => {
      return Promise.all(
        docNames.map((docName) => IndexDbWorkspaceFile.openFile(docName, opts)),
      );
    });
  }

  static async createFile(docName, doc, metadata, opts) {
    const data = await opts.dbInstance.getItem(docName);
    if (data) {
      throw new Error('File already exists');
    }

    const file = new IndexDbWorkspaceFile(docName, doc, metadata, opts);
    await file.updateDoc();
    return file;
  }

  static transformMetadata = (metadata) => {
    return {
      modified: 0,
      created: 0,
      version: 1,
      ...metadata,
    };
  };

  constructor(docName, doc, metadata, opts) {
    metadata = IndexDbWorkspaceFile.transformMetadata(metadata);
    super(docName, doc, metadata, opts);
    if (!opts.dbInstance) {
      throw new Error('Db Instance not found');
    }
  }

  async delete() {
    await this._opts.dbInstance.removeItem(this.docName);
    this.deleted = true;
  }

  async updateDoc(newDoc, metadata = {}) {
    if (this.deleted) {
      return;
    }

    if (newDoc) {
      this.doc = newDoc;
    }

    await this._opts.dbInstance.setItem(this.docName, {
      ...this.metadata,
      ...metadata,
      doc: this.doc,
      docName: this.docName,
    });
  }
}

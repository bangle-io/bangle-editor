import localforage from 'localforage';

import { Workspace } from './workspace';
import { getIdleCallback, sleep, uuid } from 'bangle-core/utils/js-utils';
import { NativeWorkspaceFile } from './native-workspace-file';
import {
  readFile,
  recurseDirHandle,
} from '../components/native-file-api/helper';
import { markdownParser } from 'bangle-plugins/markdown/markdown-parser';
import { markdownSerializer } from 'bangle-plugins/markdown/markdown-serializer';
const LOG = true;

let log = LOG ? console.log.bind(console, 'play/native-workspace') : () => {};

export const TYPE_NATIVE = 'native';
const createNativeUID = () => TYPE_NATIVE + '_' + uuid(6);

export class NativeWorkspace extends Workspace {
  static async getDbInstance(uid, metadata, schema) {
    if (!metadata) {
      throw new Error('metadata needed');
    }
    if (!schema) {
      throw new Error('schema needed');
    }

    return FSStorage.createInstance(metadata.dirHandle, schema);
  }

  static async restoreWorkspaceFromBackupFile(data, schema) {
    const uid = createNativeUID();
    const dbInstance = await NativeWorkspace.getDbInstance(uid, {}, schema);

    let { name, files, metadata } = data;

    // old style backup
    if (Array.isArray(data)) {
      name = 'pyare-mohan' + Math.floor(100 * Math.random());
      files = await Promise.all(
        data.map((item) =>
          NativeWorkspaceFile.fromJSON(item, { schema, dbInstance }),
        ),
      );
      metadata = {};
    } else {
      files = await Promise.all(
        files.map((item) =>
          NativeWorkspaceFile.fromJSON(item, { schema, dbInstance }),
        ),
      );
    }

    const opts = {
      dbInstance,
      schema,
      metadata,
      name,
    };

    const type = TYPE_NATIVE;
    const instance = new NativeWorkspace(uid, files, type, opts);
    await instance.persistWorkspaceInfo();
    return instance;
  }

  static async openWorkspace(uid, name, schema, metadata = {}) {
    const dbInstance = await NativeWorkspace.getDbInstance(
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
    let files = await NativeWorkspaceFile.getAllFilesInDb(opts);
    const instance = new NativeWorkspace(uid, files, TYPE_NATIVE, opts);
    await instance.persistWorkspaceInfo();
    return instance;
  }

  static openExistingWorkspace(workspaceInfo, schema) {
    const { uid, name, metadata } = workspaceInfo;
    return NativeWorkspace.openWorkspace(uid, name, schema, metadata);
  }

  static async createWorkspace(name, schema) {
    const uid = createNativeUID();
    return NativeWorkspace.openWorkspace(uid, name, schema);
  }

  updateFiles(files) {
    return new NativeWorkspace(this.uid, files, this.type, this._opts);
  }

  /**
   * TODO remove this, no need to put it in here
   */
  async createFile(docName, doc) {
    return NativeWorkspaceFile.createFile(docName, doc, undefined, this._opts);
  }

  async deleteWorkspace() {
    if (this.deleted) {
      return;
    }

    super.deleteWorkspace();
    let files = await NativeWorkspaceFile.getAllFilesInDb(this._opts);
    files.forEach((value) => {
      value.delete();
    });
    getIdleCallback(() => {
      dropInstance({ name: this.uid });
    });
  }
}

export async function pickADirectory(dirHandle) {
  if (dirHandle) {
    let permission = await verifyPermission(dirHandle);
    if (!permission) {
      throw new NoPermissionError(
        'The permission to edit directory was denied',
      );
    }
  } else {
    try {
      dirHandle = await window.showDirectoryPicker();
    } catch (err) {
      console.error(err);
      throw new NoPermissionError(err.message);
    }
  }

  return dirHandle;
}

async function verifyPermission(fileHandle, withWrite = true) {
  const opts = {};
  if (withWrite) {
    opts.writable = true;
    // For Chrome 86 and later...
    opts.mode = 'readwrite';
  }
  // Check if we already have permission, if so, return true.
  if ((await fileHandle.queryPermission(opts)) === 'granted') {
    return true;
  }
  // Request permission to the file, if the user grants permission, return true.
  if ((await fileHandle.requestPermission(opts)) === 'granted') {
    return true;
  }
  // The user did nt grant permission, return false.
  return false;
}

export class NoPermissionError extends Error {
  constructor(errorCode, body) {
    super(body);
    this.errorCode = errorCode;
    this.body = body;
    Error.captureStackTrace(this, NoPermissionError);
    this.name = this.constructor.name;
  }
}

class FSStorage {
  // TODO check if the new directory is something we already have
  // in our database
  static async createInstance(dirHandle, schema) {
    await pickADirectory(dirHandle);
    return new FSStorage(dirHandle, schema);
  }

  static getFilePathKey = (filePathHandles) =>
    filePathHandles.map((r) => r.name).join('/');

  _transformer = async (filePathHandles) => {
    const textContent = await readFile(
      await getLast(filePathHandles).getFile(),
    );
    const key = FSStorage.getFilePathKey(filePathHandles);
    const doc = await this._parser.parse(textContent);
    return {
      key,
      value: doc.toJSON(),
    };
  };

  _updateFilePathHandles = async () => {
    this._filePathHandles = await recurseDirHandle(this._rootDirHandle, {
      allowedFile: (entry) => entry.name.endsWith('.md'),
    });
    return this._filePathHandles;
  };

  _findPathHandlersByKey = (key) => {
    return this._filePathHandles.find(
      (paths) => FSStorage.getFilePathKey(paths) === key,
    );
  };

  constructor(dirHandle, schema) {
    this._rootDirHandle = dirHandle;
    this._schema = schema;

    this._parser = markdownParser(schema);
    this._serializer = markdownSerializer(schema);
  }

  async iterate(cb) {
    await this._updateFilePathHandles();

    await Promise.all(
      this._filePathHandles.map(async (filePathHandle, i) => {
        // const fileHandle = getLast(filePathHandle);
        const key = FSStorage.getFilePathKey(filePathHandle);
        cb(null, key, i);
      }),
    );
  }

  // TODO support created nested keys
  createNewItemKey(fileName = uuid(6), parent) {
    // root
    if (!parent) {
      return [this._rootDirHandle.name, fileName + '.md'].join('/');
    }

    throw new Error('Not implemented');
  }

  async getItem(key) {
    const match = this._findPathHandlersByKey(key);

    if (match) {
      const { value } = await this._transformer(match);
      return { doc: value };
    }
  }

  async removeItem(key) {
    const match = this._findPathHandlersByKey(key);
    if (!match) {
      throw new Error(`Key ${key} not found`);
    }

    await match[match.length - 2].removeEntry(getLast(match).name);
    await this._updateFilePathHandles();
  }

  async setItem(key, value) {
    const _setItem = async (match) => {
      const handler = match[match.length - 1];
      let data = '';
      // When a new file is created initially the value.doc is null
      if (value.doc) {
        const doc = this._schema.nodeFromJSON(value.doc);
        data = this._serializer.serialize(doc);
      }
      await writeFile(handler, data);
      return;
    };

    let match = this._filePathHandles.find(
      (paths) => FSStorage.getFilePathKey(paths) === key,
    );

    if (match) {
      await _setItem(match);
      return;
    }

    // TODO currently this only creates rootlevel files
    // if not found attempt to create it
    const name = getLast(key.split('/'));
    await this._rootDirHandle.getFileHandle(name, { create: true });
    await this._updateFilePathHandles();
    match = this._filePathHandles.find(
      (paths) => FSStorage.getFilePathKey(paths) === key,
    );
    await _setItem(match);
    return;
  }
}

async function writeFile(fileHandle, contents) {
  // Support for Chrome 82 and earlier.
  if (fileHandle.createWriter) {
    // Create a writer (request permission if necessary).
    const writer = await fileHandle.createWriter();
    // Write the full length of the contents
    await writer.write(0, contents);
    // Close the file and write the contents to disk
    await writer.close();
    return;
  }
  // For Chrome 83 and later.
  // Create a FileSystemWritableFileStream to write to.
  const writable = await fileHandle.createWritable();
  // Write the contents of the file to the stream.
  await writable.write(contents);
  // Close the file and write the contents to disk.
  await writable.close();
}

function getLast(array) {
  return array[array.length - 1];
}

import localforage from 'localforage';

import { filter } from 'bangle-core/utils/pm-utils';
import React from 'react';
import { recurseDirHandle } from './helper';

export const db = localforage.createInstance({
  name: 'native-file/1',
});

export class NativeFileApi extends React.Component {
  openFilePicker = async () => {
    try {
      const fileHandle = await pickADirectory();
    } catch (ex) {
      if (ex.name === 'AbortError') {
        return;
      }
      const msg = 'An error occured trying to open the file.';
      console.error(msg, ex);
      alert(msg);
    }
  };
  render() {
    return <div onClick={this.openFilePicker}>open files</div>;
  }
}

function getFileHandle() {
  // For Chrome 86 and later...
  if ('showOpenFilePicker' in window) {
    return window.showOpenFilePicker().then((handles) => handles[0]);
  }
  // For Chrome 85 and earlier...
  return window.chooseFileSystemEntries();
}

async function pickADirectory() {
  let dirHandles = await getHandles('local');
  let dirHandle;
  if (Array.isArray(dirHandles) && dirHandles[0]) {
    dirHandle = dirHandles[0];
    let z = await verifyPermission(dirHandle);
    if (!z) {
      alert('no permission');
      return;
    }
  } else {
    dirHandle = await window.showDirectoryPicker().catch((err) => {
      console.error(err);
    });
    console.log('here');
    saveHandles('local', [dirHandle]);
  }

  let files = await recurseDirHandle(dirHandle, {
    allowedFile: (entry) => entry.name.endsWith('.md'),
  });
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

async function saveHandles(key, handles) {
  return db.setItem(key, handles);
}

async function getHandles(key) {
  let result = db.getItem(key);
  return result;
}

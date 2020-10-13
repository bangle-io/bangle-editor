import { NativeWorkspace, TYPE_NATIVE } from './native-workspace';
import { IndexDbWorkspace, TYPE_INDEXDB } from './indexdb-workspace';

export function openExistingWorkspace(workspaceInfo, schema) {
  if (workspaceInfo.uid.startsWith(TYPE_INDEXDB)) {
    return IndexDbWorkspace.openExistingWorkspace(workspaceInfo, schema);
  }

  if (workspaceInfo.uid.startsWith(TYPE_NATIVE)) {
    return NativeWorkspace.openExistingWorkspace(workspaceInfo, schema);
  }

  throw new Error('Not implemented ' + workspaceInfo.uid);
}

export function restoreWorkspaceFromBackupFile(schema, data, type) {
  if (type === TYPE_INDEXDB) {
    return IndexDbWorkspace.restoreWorkspaceFromBackupFile(data, schema);
  }

  if (type === TYPE_NATIVE) {
    return NativeWorkspace.restoreWorkspaceFromBackupFile(data, schema);
  }

  throw new Error('Not implemented ' + type);
}

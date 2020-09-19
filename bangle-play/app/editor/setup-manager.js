import { Manager } from 'bangle-plugins/collab/server/manager';
import { Disk } from 'bangle-plugins/persistence/disk';
import { getSchema } from '../editor/utils';
import { extensions } from '../editor/extensions';
import {
  activeDatabaseName,
  activeDatabaseInstance,
} from '../store/local/database-helpers';
import { defaultContent } from '../components/constants';

const DEBUG = true;

export function setUpManager() {
  const schema = getSchema(extensions());
  const disk = new Disk({
    db: activeDatabaseInstance,
    defaultDoc: defaultContent,
  });
  const manager = new Manager(schema, {
    disk,
  });

  if (
    activeDatabaseName === 'production' ||
    process.env.NODE_ENV === 'production'
  ) {
    window.addEventListener('beforeunload', (event) => {
      disk.myMainDisk.flushAll();
      event.returnValue = `Are you sure you want to leave?`;
    });
  }

  if (DEBUG) {
    window.manager = manager;
  }

  return manager;
}

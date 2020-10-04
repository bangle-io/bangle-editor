import { Manager } from 'bangle-plugins/collab/server/manager';
import { activeDatabaseName } from '../store/local/database-helpers';
import { defaultContent } from '../components/constants';
import { LocalDisk } from 'bangle-plugins/local-disk/local-disk';

const DEBUG = true;

export function setUpManager(db, schema) {
  const disk = new LocalDisk(db, {
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

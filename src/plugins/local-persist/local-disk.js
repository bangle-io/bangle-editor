import localforage from 'localforage';

localforage.config({
  name: 'bangle/1',
  version: 1.0,
});

export class LocalDisk {
  constructor(instances, newInstance) {
    this.store = localforage.createInstance({
      name: 'local_disk',
    });
    this.saveTimeout = null;
    this.saveEvery = 1000;
    this.instances = instances;
    this.newInstance = newInstance;
    this._init();
  }

  _init() {
    this.store
      .iterate((value, key, iterationNumber) => {
        // Resulting key/value pair -- this callback
        // will be executed for every item in the
        // database.
        // console.log([key, value]);
        console.log('loading', key);
        this.newInstance(key, value);
      })
      .then(() => {
        console.log('Iteration has completed');
      })
      .catch((err) => {
        // This code runs if there were any errors
        console.error(err);
      });
  }

  async _write(key, value) {
    console.log('writting');
    await this.store.setItem(key, value);
  }

  scheduleSave = () => {
    if (this.saveTimeout != null) return;
    this.saveTimeout = setTimeout(this._doSave, this.saveEvery);
  };

  _doSave = async () => {
    this.saveTimeout = null;

    for (var prop in this.instances) {
      console.log(this.instances[prop].doc.toString());
      await this._write(prop, { doc: this.instances[prop].doc.toJSON() });
    }
  };
}

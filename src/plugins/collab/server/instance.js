import { Emitter } from '../../../utils/bangle-utils/utils/emitter';

const MAX_STEP_HISTORY = 1000;

const LOG = true;

function log(...args) {
  if (LOG) console.log('collab/server/instance', ...args);
}

export class Instance {
  constructor(id, doc, schema, scheduleSave, created) {
    this.scheduleSave = scheduleSave;
    this.id = id;
    this.doc =
      doc ||
      schema.node('doc', null, [
        schema.node('paragraph', null, [
          schema.text(
            'This is a collaborative test document. Start editing to make it more interesting!',
          ),
        ]),
      ]);
    // The version number of the document instance.
    this.version = 0;
    this.steps = [];
    this.lastActive = Date.now();
    this.users = Object.create(null);
    this.userCount = 0;
    this.waiting = [];
    this.collecting = null;
    this.lastModified = this.lastActive;
    this.created = created || Date.now();
  }

  stop() {
    if (this.collecting != null) clearInterval(this.collecting);
  }

  addEvents(version, steps, clientID) {
    this.checkVersion(version);
    if (this.version !== version) {
      console.log('this version', this.version, 'not same as ', version);
      return false;
    }
    let doc = this.doc,
      maps = [];
    for (let i = 0; i < steps.length; i++) {
      steps[i].clientID = clientID;
      let result = steps[i].apply(doc);
      doc = result.doc;
      maps.push(steps[i].getMap());
    }
    this.doc = doc;
    this.version += steps.length;
    this.steps = this.steps.concat(steps);
    if (this.steps.length > MAX_STEP_HISTORY)
      this.steps = this.steps.slice(this.steps.length - MAX_STEP_HISTORY);

    this.sendUpdates();
    this.scheduleSave();
    return { version: this.version };
  }

  sendUpdates() {
    while (this.waiting.length) {
      const popped = this.waiting.pop();
      log('sending up to ip', popped.ip);
      popped.finish();
    }
  }

  // : (Number)
  // Check if a document version number relates to an existing
  // document version.
  checkVersion(version) {
    if (typeof version !== 'number') {
      throw new Error('version is not a number');
    }
    if (version < 0 || version > this.version) {
      let err = new Error('Invalid version ' + version);
      err.status = 400;
      throw err;
    }
  }

  // : (Number, Number)
  // Get events between a given document version and
  // the current document version.
  getEvents(version) {
    this.checkVersion(version);
    let startIndex = this.steps.length - (this.version - version);
    if (startIndex < 0) return false;

    return {
      steps: this.steps.slice(startIndex),
      users: this.userCount,
    };
  }

  collectUsers() {
    const oldUserCount = this.userCount;
    this.users = Object.create(null);
    this.userCount = 0;
    this.collecting = null;
    log('collectUsers', [...Object.entries(this.users || {})]);
    log('waiting', [...this.waiting.map((r) => r.ip)]);
    for (let i = 0; i < this.waiting.length; i++)
      this._registerUser(this.waiting[i].ip);
    if (this.userCount !== oldUserCount) this.sendUpdates();
  }

  registerUser(ip) {
    log('registerUser', [...Object.entries(this.users || {})]);
    if (!(ip in this.users)) {
      this._registerUser(ip);
      this.sendUpdates();
    }
  }
  // TODO when switching docs its a good idea to kill users
  _registerUser(ip) {
    if (!(ip in this.users)) {
      this.users[ip] = true;
      this.userCount++;
      if (this.collecting == null)
        this.collecting = setTimeout(() => this.collectUsers(), 5000);
    }
    log('_registerUser', [...Object.entries(this.users || {})]);
  }
}

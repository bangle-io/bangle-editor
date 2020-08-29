import { CollabError } from '../collab-error';

const MAX_STEP_HISTORY = 1000;

const LOG = false;

function log(...args) {
  if (LOG) console.log('collab/server/instance', ...args);
}

export class Instance {
  constructor({
    docName,
    doc,
    schema,
    scheduleSave,
    created,
    collectUsersTimeout,
  } = {}) {
    this.scheduleSave = scheduleSave;
    this.docName = docName;
    this.doc =
      doc ||
      schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('Namaste!')]),
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
    this.collectUsersTimeout = collectUsersTimeout;
    this.created = created || Date.now();
  }

  stop() {
    if (this.collecting != null) {
      clearInterval(this.collecting);
    }
  }

  addEvents(version, steps, clientID) {
    this.checkVersion(version);
    if (this.version !== version) {
      log('this version', this.version, 'not same as ', version);
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
      log('sending up to user:', popped.userId);
      popped.onFinish();
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
      throw new CollabError(400, 'Invalid version ' + version);
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
    log('waiting', [...this.waiting.map((r) => r.userId)]);
    for (let i = 0; i < this.waiting.length; i++)
      this._registerUser(this.waiting[i].userId);
    if (this.userCount !== oldUserCount) this.sendUpdates();
  }

  registerUser(userId) {
    log('registerUser', [...Object.entries(this.users || {})]);
    if (!(userId in this.users)) {
      this._registerUser(userId);
      this.sendUpdates();
    }
  }
  // TODO when switching docs its a good idea to kill users
  _registerUser(userId) {
    if (!(userId in this.users)) {
      this.users[userId] = true;
      this.userCount++;
      if (this.collecting == null)
        this.collecting = setTimeout(
          () => this.collectUsers(),
          this.collectUsersTimeout,
        );
    }
    log('_registerUser', [...Object.entries(this.users || {})]);
  }
}

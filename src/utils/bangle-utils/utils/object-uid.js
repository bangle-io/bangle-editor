let counter = 0;
export class ObjectUID extends WeakMap {
  get(obj) {
    let uid = super.get(obj);
    if (uid) {
      return uid;
    }
    uid = (counter++).toString();
    this.set(obj, uid);
    return uid;
  }
}

const objUid = new ObjectUID();

export { objUid };

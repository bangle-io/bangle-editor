let counter = 0;
let unique = Math.random();

export class ObjectUID extends WeakMap {
  get(obj: any) {
    let uid = super.get(obj);
    if (uid) {
      return uid;
    }
    uid = (counter++).toString() + '-' + unique;
    this.set(obj, uid);
    return uid;
  }
}

const objectUid = new ObjectUID();

export { objectUid };

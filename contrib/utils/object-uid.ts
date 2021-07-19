let counter = 0;
// add a unique string to prevent clashes in case multiple objectUid instances exist
// this can happen for example due to duplicate npm packages due to version or dependency mismatch
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

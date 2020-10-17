export class Disk {
  /**
   *
   * Get the
   * @param {*} key
   */
  async load(key) {}

  /**
   *
   * @param {*} key
   * @param {*} getLatestDoc
   */
  async update(key, getLatestDoc) {}

  /**
   *
   * @param {*} key
   * @param {*} doc
   */
  async flush(key, doc) {}
}

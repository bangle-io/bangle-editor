import { Node } from 'prosemirror-model';

export class Disk {
  async load(_key: string) {}

  async update(_key: string, _getLatestDoc: () => Node) {}

  async flush(_key: string, _doc: Node) {}
}

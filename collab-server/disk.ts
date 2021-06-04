import { Node } from 'prosemirror-model';

export abstract class Disk {
  abstract load(_key: string): Promise<Node>;

  abstract update(_key: string, _getLatestDoc: () => Node): Promise<void>;

  abstract flush(_key: string, _doc: Node): Promise<void>;
}

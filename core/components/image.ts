import { InputRule } from 'prosemirror-inputrules';
import { Command } from 'prosemirror-commands';
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state';
import { safeInsert } from 'prosemirror-utils';
import { Node, NodeType, Schema } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { MarkdownSerializerState } from 'prosemirror-markdown';
import Token from 'markdown-it/lib/token';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};

const name = 'image';

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function specFactory() {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      attrs: {
        src: {},
        alt: {
          default: null,
        },
        title: {
          default: null,
        },
      },
      group: 'inline',
      draggable: true,
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs: (dom: HTMLElement) => ({
            src: dom.getAttribute('src'),
            title: dom.getAttribute('title'),
            alt: dom.getAttribute('alt'),
          }),
        },
      ],
      toDOM: (node: Node) => {
        return ['img', node.attrs];
      },
    },
    markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
        const text = state.esc(node.attrs.alt || '');
        const url =
          state.esc(node.attrs.src) +
          (node.attrs.title ? ' ' + state.quote(node.attrs.title) : '');

        state.write(`![${text}](${url})`);
      },
      parseMarkdown: {
        image: {
          node: name,
          getAttrs: (tok: Token) => ({
            src: tok.attrGet('src'),
            title: tok.attrGet('title') || null,
            alt: (tok.children![0] && tok.children![0]!.content) || null,
          }),
        },
      },
    },
  };
}

function pluginsFactory({
  handleDragAndDrop = true,
  acceptFileType = 'image/*',
  createImageNodes = defaultCreateImageNodes,
}: {
  handleDragAndDrop?: boolean;
  acceptFileType?: string;
  createImageNodes?: (
    files: File[],
    imageType: NodeType,
    view: EditorView,
  ) => Promise<Node[]>;
} = {}) {
  return ({ schema }: { schema: Schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      new InputRule(
        /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/,
        (state, match, start, end) => {
          let [, alt, src, title] = match;
          if (!src) {
            return null;
          }

          if (!title) {
            title = alt;
          }
          return state.tr.replaceWith(
            start,
            end,
            type.create({
              src,
              alt,
              title,
            }),
          );
        },
      ),

      handleDragAndDrop &&
        new Plugin({
          key: new PluginKey(name + '-drop-paste'),
          props: {
            handleDOMEvents: {
              drop(view, event) {
                if (event.dataTransfer == null) {
                  return false;
                }
                const files = getFileData(
                  event.dataTransfer,
                  acceptFileType,
                  true,
                );
                // TODO should we handle all drops but just show error?
                // returning false here would just default to native behaviour
                // But then any drop handler would fail to work.
                if (!files || files.length === 0) {
                  return false;
                }
                event.preventDefault();
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });

                createImageNodes(
                  files,
                  getTypeFromSchema(view.state.schema),
                  view,
                ).then((imageNodes) => {
                  addImagesToView(
                    view,
                    coordinates == null ? undefined : coordinates.pos,
                    imageNodes,
                  );
                });

                return true;
              },
            },

            handlePaste: (view, rawEvent) => {
              const event = rawEvent;
              if (!event.clipboardData) {
                return false;
              }
              const files = getFileData(
                event.clipboardData,
                acceptFileType,
                true,
              );
              if (!files || files.length === 0) {
                return false;
              }
              createImageNodes(
                files,
                getTypeFromSchema(view.state.schema),
                view,
              ).then((imageNodes) => {
                addImagesToView(view, view.state.selection.from, imageNodes);
              });

              return true;
            },
          },
        }),
    ];
  };
}

async function defaultCreateImageNodes(
  files: File[],
  imageType: NodeType,
  _view: EditorView,
) {
  let resolveBinaryStrings = await Promise.all(
    files.map((file) => readFileAsBinaryString(file)),
  );
  return resolveBinaryStrings.map((binaryStr) => {
    return imageType.create({
      src: binaryStr,
    });
  });
}

function addImagesToView(
  view: EditorView,
  pos: number | undefined,
  imageNodes: Node[],
) {
  for (const node of imageNodes) {
    const { tr } = view.state;
    let newTr = safeInsert(node, pos)(tr);

    if (newTr === tr) {
      continue;
    }

    view.dispatch(newTr);
  }
}

function readFileAsBinaryString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const onLoadBinaryString: FileReader['onload'] = (readerEvt) => {
      const binarySrc = btoa(readerEvt.target!.result as string);
      resolve(`data:${file.type};base64,${binarySrc}`);
    };
    const onLoadDataUrl: FileReader['onload'] = (readerEvt) => {
      resolve(readerEvt.target!.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Error reading file' + file.name));
    };

    // Some browsers do not support this
    if ('readAsDataURL' in reader) {
      reader.onload = onLoadDataUrl;
      reader.readAsDataURL(file);
    } else {
      // @ts-ignore
      reader.onload = onLoadBinaryString;
      // @ts-ignore
      reader.readAsBinaryString(file);
    }
  });
}

function getFileData(data: DataTransfer, accept: string, multiple: boolean) {
  const dragDataItems = getMatchingItems(data.items, accept, multiple);
  const files: File[] = [];

  dragDataItems.forEach((item) => {
    const file = item && item.getAsFile();
    if (file == null) {
      return;
    }
    files.push(file);
  });

  return files;
}

function getMatchingItems(
  list: DataTransferItemList,
  accept: string,
  multiple: boolean,
) {
  const dataItems = Array.from(list);
  let results;

  // Return the first item (or undefined) if our filter is for all files
  if (accept === '') {
    results = dataItems.filter((item) => item.kind === 'file');
    return multiple ? results : [results[0]];
  }

  const accepts = accept
    .toLowerCase()
    .split(',')
    .map((accept) => {
      return accept.split('/').map((part) => part.trim());
    })
    .filter((acceptParts) => acceptParts.length === 2); // Filter invalid values

  const predicate = (item: DataTransferItem) => {
    if (item.kind !== 'file') {
      return false;
    }

    const [typeMain, typeSub] = item.type
      .toLowerCase()
      .split('/')
      .map((s) => s.trim());

    for (const [acceptMain, acceptSub] of accepts) {
      // Look for an exact match, or a partial match if * is accepted, eg image/*.
      if (
        typeMain === acceptMain &&
        (acceptSub === '*' || typeSub === acceptSub)
      ) {
        return true;
      }
    }
    return false;
  };

  results = results = dataItems.filter(predicate);
  if (multiple === false) {
    results = [results[0]];
  }

  return results;
}

export const updateImageNodeAttribute =
  (attr: Node['attrs'] = {}): Command =>
  (state, dispatch) => {
    if (!(state.selection instanceof NodeSelection) || !state.selection.node) {
      return false;
    }
    const { node } = state.selection;
    if (node.type !== getTypeFromSchema(state.schema)) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr.setNodeMarkup(state.selection.$from.pos, undefined, {
          ...node.attrs,
          ...attr,
        }),
      );
    }
    return true;
  };

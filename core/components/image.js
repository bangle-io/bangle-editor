import { InputRule } from 'prosemirror-inputrules';
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state';
import { safeInsert } from 'prosemirror-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};

const name = 'image';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
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
          getAttrs: (dom) => ({
            src: dom.getAttribute('src'),
            title: dom.getAttribute('title'),
            alt: dom.getAttribute('alt'),
          }),
        },
      ],
      toDOM: (node) => {
        return ['img', node.attrs];
      },
    },
    markdown: {
      toMarkdown(state, node) {
        const text = state.esc(node.attrs.alt || '');
        const url =
          state.esc(node.attrs.src) +
          (node.attrs.title ? ' ' + state.quote(node.attrs.title) : '');

        state.write(`![${text}](${url})`);
      },
      parseMarkdown: {
        image: {
          node: name,
          getAttrs: (tok) => ({
            src: tok.attrGet('src'),
            title: tok.attrGet('title') || null,
            alt: (tok.children[0] && tok.children[0].content) || null,
          }),
        },
      },
    },
  };
}

function pluginsFactory({ handleDragAndDrop = true, keybindings = {} } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      new InputRule(
        /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/,
        (state, match, start, end) => {
          let [, alt, src, title] = match;
          if (!src) {
            return;
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
                const files = getFileData(event.dataTransfer, 'image/*', true);
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

                addImagesToView(
                  view,
                  coordinates == null ? undefined : coordinates.pos,
                  files.map((file) => readFile(file)),
                );

                return true;
              },
            },

            handlePaste: (view, rawEvent, slice) => {
              const event = rawEvent;
              if (!event.clipboardData) {
                return false;
              }
              const files = getFileData(event.clipboardData, 'image/*', true);
              if (!files || files.length === 0) {
                return false;
              }
              addImagesToView(
                view,
                view.state.selection.from,
                files.map((file) => readFile(file)),
              ).catch((err) => console.error(err));
              return true;
            },
          },
        }),
    ];
  };
}

async function addImagesToView(view, pos, imagePromises) {
  for (const imagePromise of imagePromises) {
    const image = await imagePromise;
    const node = getTypeFromSchema(view.state.schema).create({
      src: image,
    });
    const { tr } = view.state;
    const newTr = safeInsert(node, pos)(tr);

    if (newTr === tr) {
      continue;
    }

    view.dispatch(newTr);
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const onLoadBinaryString = (readerEvt) => {
      const binarySrc = btoa(readerEvt.target.result);
      resolve(`data:${file.type};base64,${binarySrc}`);
    };
    const onLoadDataUrl = (readerEvt) => {
      resolve(readerEvt.target.result);
    };
    reader.onerror = () => {
      reject(new Error('Error reading file' + file.name));
    };

    // Some browsers do not support this
    if ('readAsDataURL' in reader) {
      reader.onload = onLoadDataUrl;
      reader.readAsDataURL(file);
    } else {
      reader.onload = onLoadBinaryString;
      reader.readAsBinaryString(file);
    }
  });
}

function getFileData(data, accept, multiple) {
  const dragDataItems = getMatchingItems(data.items, accept, multiple);
  const files = [];

  dragDataItems.forEach((item) => {
    const file = item && item.getAsFile();
    if (file == null) {
      return;
    }
    files.push(file);
  });

  return files;
}

function getMatchingItems(list, accept, multiple) {
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

  const predicate = (item) => {
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

export const updateImageNodeAttribute = (attr = {}) => (
  state,
  dispatch,
  view,
) => {
  if (!state.selection instanceof NodeSelection || !state.selection.node) {
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

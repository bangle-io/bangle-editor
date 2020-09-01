import localforage from 'localforage';

export async function getAllDbData(id) {
  let source = localforage.createInstance({
    name: id,
  });
  const items = await new Promise((res) => {
    let result = [];
    source
      .iterate((value, key, iterationNumber) => {
        result.push(value);
      })
      .then(() => {
        res(result);
      });
  });
  return items;
}

export async function putDbData(id, items, mapping = (a) => a) {
  let target = localforage.createInstance({
    name: id,
  });

  for (const item of items) {
    await target.setItem(
      item.docName || item.uid,
      mapping({
        ...item,
        docName: item.docName || item.uid,
        doc: item.doc || item.content,
        version: item.version || 1,
      }),
    );
  }
}
export async function backupDb(id, backUpId = 'backup/' + id) {
  const items = await getAllDbData(id);

  await putDbData(backUpId, items);
}

export const activeDB =
  new URLSearchParams(window.location.search).get('database') ||
  'bangle-play/v1';

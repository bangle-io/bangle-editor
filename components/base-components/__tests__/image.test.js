/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  createEvent,
  dispatchPasteEvent,
  psx,
  typeText,
} from '@bangle.dev/test-helpers';
import { sleep } from '@bangle.dev/utils';

import { defaultTestEditor } from './test-editor';

const testEditor = defaultTestEditor({});
const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==';

describe('Markdown shorthand', () => {
  it('works', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello[]</para>
      </doc>,
    );

    typeText(view, '![image](image.jpg)');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          hello
          <image src="image.jpg" title="image" alt="image" />
          []
        </para>
      </doc>,
    );
  });
});

describe('Image pasting', () => {
  it('pasting single image', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello[]</para>
      </doc>,
    );

    const file = new File([dataURItoBlob(image)], 'image.png', {
      type: 'image/png',
    });

    dispatchPasteEvent(view, {
      files: [file],
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
    });

    // wait for editor to add the node
    await sleep(40);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          hello[]
          <image src={image} />
        </para>
      </doc>,
    );
  });

  it('pasting two images', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello[]</para>
      </doc>,
    );

    const file = new File([dataURItoBlob(image)], 'image.png', {
      type: 'image/png',
    });

    dispatchPasteEvent(view, {
      files: [file],
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => file,
        },
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
    });

    // wait for editor to add the node
    await sleep(40);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          hello[]
          <image src={image} />
          <image src={image} />
        </para>
      </doc>,
    );
  });

  it('filters out non images', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello[]</para>
      </doc>,
    );

    const file = new File([dataURItoBlob(image)], 'image.png', {
      type: 'image/png',
    });

    dispatchPasteEvent(view, {
      files: [file],
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => file,
        },
        {
          kind: 'file',
          type: 'doc/xml',
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
    });

    // wait for editor to add the node
    await sleep(40);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          hello[]
          <image src={image} />
        </para>
      </doc>,
    );
  });

  it('when item.getAsFile returns null', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello[]</para>
      </doc>,
    );

    const file = new File([dataURItoBlob(image)], 'image.png', {
      type: 'image/png',
    });

    dispatchPasteEvent(view, {
      files: [file],
      items: [
        {
          kind: 'file',
          type: 'doc/xml',
          getAsFile: () => null,
        },
      ],
      types: ['Files'],
    });

    // wait for editor to add the node
    await sleep(40);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>hello[]</para>
      </doc>,
    );
  });
});

describe('Image dropping', () => {
  it('dropping single image', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello[]</para>
      </doc>,
    );

    const file = new File([dataURItoBlob(image)], 'image.png', {
      type: 'image/png',
    });

    const event = createEvent('drop');
    Object.defineProperties(event, {
      dataTransfer: {
        value: {
          getData: () => '',
          setData: () => {},
          clearData: () => {},
          types: ['Files'],
          files: [file],
          items: [
            {
              kind: 'file',
              type: 'image/png',
              getAsFile: () => file,
            },
          ],
        },
      },
    });

    // the dom API `elementFromPoint` used by postAtCoords is not
    // available in jsdom, hence mocking it.
    view.posAtCoords = jest.fn(() => {});
    view.dispatchEvent(event);

    // wait for editor to add the node
    await sleep(40);
    expect(view.posAtCoords).toBeCalledTimes(1);
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          hello
          <image src={image} />
          []
        </para>
      </doc>,
    );
  });
});

function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  const byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  const ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  const blob = new Blob([ab], { type: mimeString });
  return blob;
}

/**
 * @jest-environment jsdom
 * @jsx pjsx
 */
import {
  BangleEditor as CoreBangleEditorView,
  getRenderHandlers,
  SpecRegistry,
} from '@bangle.dev/core';
import React, { useEffect, useRef } from 'react';
import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { selectNodeAt } from '@bangle.dev/test-helpers';
import { EditorView as PMEditorView, Node } from '@bangle.dev/pm';
import { removeSelectedNode, safeInsert, sleep } from '@bangle.dev/utils';
import { fireEvent, render } from '@testing-library/react';
import { useEditorState } from '../src/hooks';
import { BangleEditor } from '../src/index';
import { pjsx } from './helpers/index';
import { Banana, bananaComponent } from './setup/banana';

const consoleError = console.error;

beforeEach(() => {
  console.error = consoleError;
});

function Comp({
  plugins,
  specRegistry,
  onReady,
  id = 'test',
  renderNodeViews,
}) {
  const editorState = useEditorState({
    specRegistry,
    plugins: () => plugins,
  });
  return (
    <BangleEditor
      state={editorState}
      id={id}
      onReady={onReady}
      renderNodeViews={renderNodeViews}
    />
  );
}

function CompWithRef({
  plugins,
  specRegistry,
  id = 'test',
  renderNodeViews,
  refReady,
}) {
  const editorState = useEditorState({
    specRegistry,
    plugins: () => plugins,
  });
  const ref = useRef();

  useEffect(() => {
    refReady(ref);
  }, [refReady]);
  return (
    <BangleEditor
      ref={ref}
      state={editorState}
      id={id}
      renderNodeViews={renderNodeViews}
    />
  );
}

const insertBananaAtSelection =
  (attrs = {}) =>
  (dispatch, state) => {
    const node = state.schema.nodes.banana.create(attrs);
    const newTr = safeInsert(node, state.selection.from)(state.tr);
    if (dispatch) {
      dispatch(newTr);
    }
    return true;
  };

describe('basic tests', () => {
  let specRegistry, plugins;
  beforeEach(() => {
    specRegistry = new SpecRegistry(defaultSpecs());
    plugins = defaultPlugins();
  });

  test('mounts correctly', async () => {
    const onReady = jest.fn();

    const result = await render(
      <Comp
        specRegistry={specRegistry}
        plugins={() => plugins}
        onReady={onReady}
      />,
    );

    expect(onReady).toBeCalledTimes(1);
    expect(onReady).toHaveBeenNthCalledWith(
      1,
      expect.any(CoreBangleEditorView),
    );
    expect(result.container).toMatchInlineSnapshot(`
      <div>
        <div
          id="test"
        >
          <div
            class="ProseMirror bangle-editor"
            contenteditable="true"
            translate="no"
          >
            <p>
              <br
                class="ProseMirror-trailingBreak"
              />
            </p>
          </div>
        </div>
      </div>
    `);
  });

  test('Unmounting destroys editor', async () => {
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };
    const result = await render(
      <Comp
        specRegistry={specRegistry}
        plugins={() => plugins}
        onReady={onReady}
      />,
    );
    expect(editor.view.docView).toBeTruthy();
    await result.unmount();
    expect(editor.view.docView).toBeNull();
  });

  test('forwards ref correctly', async () => {
    const specRegistry = new SpecRegistry(defaultSpecs());
    const plugins = defaultPlugins();
    let editorRef;
    const refReady = jest.fn((ref) => {
      editorRef = ref;
    });
    const result = await render(
      <CompWithRef
        refReady={refReady}
        specRegistry={specRegistry}
        plugins={() => plugins}
      />,
    );
    expect(refReady).toBeCalledTimes(1);
    expect(editorRef?.current).toBeInstanceOf(CoreBangleEditorView);
    expect(result.container).toMatchInlineSnapshot(`
    <div>
      <div
        id="test"
      >
        <div
          class="ProseMirror bangle-editor"
          contenteditable="true"
          translate="no"
        >
          <p>
            <br
              class="ProseMirror-trailingBreak"
            />
          </p>
        </div>
      </div>
    </div>
  `);
  });
});

describe('rendering node views', () => {
  test('persists node view render handlers', async () => {
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    await render(
      <Comp
        specRegistry={new SpecRegistry([...defaultSpecs()])}
        plugins={() => defaultPlugins()}
        onReady={onReady}
      />,
    );

    expect(getRenderHandlers(editor.view)).toEqual({
      create: expect.any(Function),
      update: expect.any(Function),
      destroy: expect.any(Function),
    });
  });

  test('Throws error if rendering is not implemented', async () => {
    console.error = jest.fn();

    const banana = bananaComponent('react-editor-test');
    const spec = new SpecRegistry([...defaultSpecs(), banana.spec()]);
    const initialValue = (<doc>
      <para>
        hello <banana color="brown" /> world
      </para>
    </doc>)(spec.schema);

    const Comp = () => {
      const editorState = useEditorState({
        specRegistry: spec,
        plugins: () => [...defaultPlugins(), banana.plugins()],
        initialValue,
      });
      return (
        <BangleEditor
          renderNodeViews={() => {}}
          state={editorState}
          id={'test'}
        />
      );
    };
    expect(() => render(<Comp />)).toThrowErrorMatchingInlineSnapshot(
      `"renderNodeView must handle rendering for node of type \\"banana\\""`,
    );
  });

  test('Handles add and delete of node views', async () => {
    console.error = jest.fn();
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    const renderNodeViews = jest.fn(({ node, ...args }) => {
      if (node.type.name === 'banana') {
        return <Banana node={node} {...args} />;
      }
      throw new Error('Unknown node');
    });

    const banana = bananaComponent('react-editor-test');
    const spec = new SpecRegistry([...defaultSpecs(), banana.spec()]);

    const initialValue = (<doc>
      <para>hello world</para>
    </doc>)(spec.schema);

    const Comp = () => {
      const editorState = useEditorState({
        specRegistry: spec,
        plugins: () => [...defaultPlugins(), banana.plugins()],
        initialValue,
      });
      return (
        <BangleEditor
          renderNodeViews={renderNodeViews}
          state={editorState}
          id={'test'}
          onReady={onReady}
        />
      );
    };

    const { container } = await render(<Comp />);
    const view = editor.view;
    insertBananaAtSelection()(view.dispatch, view.state);
    await sleep(10);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <banana />
          hello world
        </para>
      </doc>,
    );

    insertBananaAtSelection({ color: 'pink' })(view.dispatch, view.state);
    insertBananaAtSelection({ color: 'brown' })(view.dispatch, view.state);

    expect(renderNodeViews).toBeCalledTimes(6);

    await sleep(10);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <banana color={'brown'} />
          <banana color={'pink'} />
          <banana color={'yellow'} />
          hello world
        </para>
      </doc>,
    );

    expect(container).toMatchSnapshot();

    // Select pink one
    selectNodeAt(view, 2);
    expect(view.state.selection.node.attrs).toMatchObject({ color: 'pink' });

    view.dispatch(removeSelectedNode(view.state.tr));

    expect(renderNodeViews).toBeCalledTimes(9);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <banana color={'brown'} />
          <banana color={'yellow'} />
          hello world
        </para>
      </doc>,
    );

    expect(container).toMatchSnapshot();
  });

  test('handles updating of attrs', async () => {
    console.error = jest.fn();
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    const renderNodeViews = jest.fn(({ node, ...args }) => {
      if (node.type.name === 'banana') {
        return <Banana node={node} {...args} />;
      }
      throw new Error('Unknown node');
    });

    const banana = bananaComponent('react-editor-test');
    const spec = new SpecRegistry([...defaultSpecs(), banana.spec()]);
    const initialValue = (<doc>
      <para>hello world</para>
    </doc>)(spec.schema);

    const Comp = () => {
      const editorState = useEditorState({
        specRegistry: spec,
        plugins: () => [...defaultPlugins(), banana.plugins()],
        initialValue,
      });
      return (
        <BangleEditor
          renderNodeViews={renderNodeViews}
          state={editorState}
          id={'test'}
          onReady={onReady}
        />
      );
    };

    const { container } = await render(<Comp />);
    const view = editor.view;
    insertBananaAtSelection({ color: 'blue' })(view.dispatch, view.state);
    insertBananaAtSelection({ color: 'red' })(view.dispatch, view.state);
    insertBananaAtSelection({ color: 'orange' })(view.dispatch, view.state);
    await sleep(10);

    const orangeBananaDOM = container.querySelector(`[data-color="orange"]`);
    expect(orangeBananaDOM).toMatchInlineSnapshot(`
      <div
        data-color="orange"
      >
        I am fresh orange banana
      </div>
    `);

    fireEvent.click(orangeBananaDOM);
    await sleep(10);
    expect(orangeBananaDOM).toMatchInlineSnapshot(`
      <div
        data-color="orange"
      >
        I am stale orange banana
      </div>
    `);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <banana ripe="stale" color={'orange'} />
          <banana color={'red'} />
          <banana color={'blue'} />
          hello world
        </para>
      </doc>,
    );
  });

  test('Calls rendering with correct params', async () => {
    console.error = jest.fn();
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    const renderNodeViews = jest.fn(({ node, ...args }) => {
      if (node.type.name === 'banana') {
        return <Banana node={node} {...args} />;
      }
      throw new Error('Unknown node');
    });

    const banana = bananaComponent('react-editor-test');
    const spec = new SpecRegistry([...defaultSpecs(), banana.spec()]);

    const initialValue = (<doc>
      <para>hello world</para>
    </doc>)(spec.schema);

    const Comp = () => {
      const editorState = useEditorState({
        specRegistry: spec,
        plugins: () => [...defaultPlugins(), banana.plugins()],
        initialValue,
      });
      return (
        <BangleEditor
          renderNodeViews={renderNodeViews}
          state={editorState}
          id={'test'}
          onReady={onReady}
        />
      );
    };

    const { container } = await render(<Comp />);
    const view = editor.view;
    insertBananaAtSelection({ color: 'blue' })(view.dispatch, view.state);

    expect(renderNodeViews).toBeCalledTimes(1);
    expect(renderNodeViews).toHaveBeenNthCalledWith(1, {
      node: expect.any(Node),
      view: expect.any(PMEditorView),
      getPos: expect.any(Function),
      decorations: expect.anything(),
      selected: expect.any(Boolean),
      attrs: {
        color: 'blue',
        ripe: 'fresh',
      },
      updateAttrs: expect.any(Function),
      children: null,
    });

    const orangeBananaDOM = container.querySelector(`[data-color="blue"]`);

    fireEvent.click(orangeBananaDOM);
    await sleep(10);

    expect(renderNodeViews).toBeCalledTimes(2);
    expect(renderNodeViews).toHaveBeenNthCalledWith(2, {
      node: expect.any(Node),
      view: expect.any(PMEditorView),
      getPos: expect.any(Function),
      decorations: expect.anything(),
      selected: expect.any(Boolean),
      attrs: {
        color: 'blue',
        ripe: 'stale',
      },
      updateAttrs: expect.any(Function),
      children: null,
    });
  });
});

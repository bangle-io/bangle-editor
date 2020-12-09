/** @jsx pjsx */
/**
 * @jest-environment jsdom
 */

import { render, fireEvent } from '@testing-library/react';
import { BangleEditorView as CoreBangleEditorView } from '@banglejs/core/index';
import {
  defaultPlugins,
  defaultSpecs,
} from '@banglejs/core/test-helpers/default-components';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { BangleEditorView } from '@banglejs/react';
import { getRenderHandlers } from '@banglejs/core/node-view';
import { safeInsert, removeSelectedNode } from '@banglejs/core/utils/pm-utils';
import { bananaComponent, Banana } from './setup/banana';
import { pjsx } from './helpers/index';
import { sleep } from '@banglejs/core/utils/js-utils';
import { selectNodeAt } from '@banglejs/core/test-helpers/index';
import { Node } from '@banglejs/core/prosemirror/model';
import { EditorView as PMEditorView } from '@banglejs/core/prosemirror/view';
import { useEditorState } from '../hooks';
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
    <BangleEditorView
      state={editorState}
      id={id}
      onReady={onReady}
      renderNodeViews={renderNodeViews}
    />
  );
}

const insertBananaAtSelection = (attrs = {}) => (dispatch, state) => {
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
    specRegistry = new SpecRegistry();
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
          >
            <p>
              <br />
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
        <BangleEditorView
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
        <BangleEditorView
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

    expect(renderNodeViews).toBeCalledTimes(3);

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

    expect(renderNodeViews).toBeCalledTimes(4);

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
        <BangleEditorView
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
        <BangleEditorView
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

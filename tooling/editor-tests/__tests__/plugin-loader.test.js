import {
  NodeView,
  PluginGroup,
  SpecRegistry,
  pluginLoader,
} from '@bangle.dev/core';
import { Plugin, PluginKey } from '@bangle.dev/pm';
import { defaultPlugins, defaultSpecs } from '@bangle.dev/default-components';

const specRegistry = new SpecRegistry(defaultSpecs());

describe('nodeViews validation', () => {
  test('Throws error if duplicate nodeViews', () => {
    const plugins = [
      ...defaultPlugins(),
      NodeView.createPlugin({
        name: 'listItem',
      }),
    ];

    expect(() =>
      pluginLoader(specRegistry, plugins),
    ).toThrowErrorMatchingInlineSnapshot(
      `"NodeView validation failed. Duplicate nodeViews for 'listItem' found."`,
    );
  });

  test('Does not throw error if no duplicates', () => {
    const plugins = [
      ...defaultPlugins(),
      NodeView.createPlugin({
        name: 'bulletList',
      }),
    ];

    expect(() => pluginLoader(specRegistry, plugins)).not.toThrowError();
  });

  test('Throws error if node spec not found', () => {
    const plugins = [
      ...defaultPlugins(),
      NodeView.createPlugin({
        name: 'random_thing',
      }),
    ];

    expect(() =>
      pluginLoader(specRegistry, plugins),
    ).toThrowErrorMatchingInlineSnapshot(
      `"NodeView validation failed. Spec for 'random_thing' not found."`,
    );
  });
});

describe('Flattens plugins correctly', () => {
  test('Flattens correctly', () => {
    const group1_child = new PluginGroup('grp1_child', [
      [new Plugin({ key: new PluginKey('group1_child.first') })],
    ]);
    const group1 = [
      new Plugin({ key: new PluginKey('group1.first') }),
      new Plugin({ key: new PluginKey('group1.second') }),
      group1_child,
    ];
    const group2 = [new Plugin({ key: new PluginKey('group2.first') })];
    const group3_child = new PluginGroup('grp3child', [
      [new Plugin({ key: new PluginKey('group3_child.first') })],
    ]);
    const group3 = [group3_child];

    const group4 = new Plugin({ key: new PluginKey('group4.first') });
    expect(
      pluginLoader(specRegistry, [group1, group2, group3, group4]).map(
        (r) => r.key,
      ),
    ).toEqual(
      expect.arrayContaining([
        'group1.first$',
        'group1.second$',
        'group1_child.first$',
        'group2.first$',
        'group3_child.first$',
        'group4.first$',
        'history$',
      ]),
    );
  });

  test('passes params correctly to plugins which are functions', () => {
    const pluginFn = jest.fn(
      () => new Plugin({ key: new PluginKey('myPlug') }),
    );
    const groupChildPluginFn = jest.fn(
      () => new Plugin({ key: new PluginKey('grp1.first') }),
    );
    const group1 = new PluginGroup('grp1', [[groupChildPluginFn]]);

    expect(
      pluginLoader(specRegistry, [group1, pluginFn])
        .map((r) => r.key)
        .includes('myPlug$'),
    ).toBe(true);

    expect(pluginFn).toBeCalledTimes(1);
    expect(groupChildPluginFn).toBeCalledTimes(1);

    expect(pluginFn).nthCalledWith(1, {
      specRegistry,
      schema: specRegistry.schema,
      metadata: undefined,
    });
    expect(groupChildPluginFn).nthCalledWith(1, {
      specRegistry,
      schema: specRegistry.schema,
      metadata: undefined,
    });
  });

  test('passes params metadata correctly to plugins which are functions', () => {
    const pluginFn = jest.fn(() => new Plugin({ key: new PluginKey('myPug') }));
    const metadata = { hello: 'world' };

    expect(
      pluginLoader(specRegistry, [pluginFn], { metadata })
        .map((r) => r.key)
        .includes('myPug$'),
    ).toBe(true);

    expect(pluginFn).toBeCalledTimes(1);
    expect(pluginFn).nthCalledWith(1, {
      specRegistry,
      schema: specRegistry.schema,
      metadata,
    });
  });

  test('Throws error if duplicate groups', () => {
    const group1_child = new PluginGroup('grp1_child', [
      [new Plugin({ key: new PluginKey('group1_child.first') })],
    ]);
    const group1 = [
      new Plugin({ key: new PluginKey('group1.first') }),
      new Plugin({ key: new PluginKey('group1.second') }),
      new PluginGroup('grp1_child', []),
      group1_child,
    ];

    expect(() =>
      pluginLoader(specRegistry, [group1]),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Duplicate names of pluginGroups grp1_child not allowed."`,
    );
  });

  test('Includes history if not provided', () => {
    expect(
      pluginLoader(new SpecRegistry(), []).some((r) =>
        r.key.startsWith('history$'),
      ),
    ).toBe(true);
  });

  test('Does not include history if pluginGroup with name history exists', () => {
    expect(
      pluginLoader(new SpecRegistry(), [new PluginGroup('history', [])]).some(
        (r) => r.key.startsWith('history$'),
      ),
    ).toBe(false);
  });
});

import { SpecSheet } from '../../spec-sheet';
import { corePlugins } from '../../components/index';
import { NodeView } from '../../node-view';
import { pluginLoader } from '../plugin-loader';

describe('nodeViews validation', () => {
  test('Throws error if duplicate nodeViews', () => {
    const plugins = [
      ...corePlugins(),
      NodeView.createPlugin({
        name: 'todo_item',
      }),
    ];

    expect(() =>
      pluginLoader(new SpecSheet(), plugins),
    ).toThrowErrorMatchingInlineSnapshot(
      `"NodeView validation failed. Duplicate nodeViews for 'todo_item' found."`,
    );
  });

  test('Does not throw error if no duplicates', () => {
    const plugins = [
      ...corePlugins(),
      NodeView.createPlugin({
        name: 'bullet_list',
      }),
    ];

    expect(() => pluginLoader(new SpecSheet(), plugins)).not.toThrowError();
  });

  test('Throws error if node spec not found', () => {
    const plugins = [
      ...corePlugins(),
      NodeView.createPlugin({
        name: 'random_thing',
      }),
    ];

    expect(() =>
      pluginLoader(new SpecSheet(), plugins),
    ).toThrowErrorMatchingInlineSnapshot(
      `"NodeView validation failed. Spec for 'random_thing' not found."`,
    );
  });
});

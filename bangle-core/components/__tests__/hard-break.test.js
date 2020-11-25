/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
} from 'bangle-core/test-helpers/index';

import { hardBreak } from '../index';
const keybindings = hardBreak.defaultKeys;

describe('Basic', () => {
  const testEditor = renderTestEditor();

  it('test keyboard shortcut', () => {
    const { view } = testEditor(
      <doc>
        <para>test</para>
        <para>[]</para>
      </doc>,
    );
    sendKeyToPm(view, keybindings.insert);
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>test</para>
        <para>
          <br />
          []
        </para>
      </doc>,
    );
  });

  it('on empty doc', () => {
    const { view } = testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.insert);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <br />
          []
        </para>
      </doc>,
    );
  });

  it('with existing text', () => {
    const { view } = testEditor(
      <doc>
        <para>test[]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.insert);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          test
          <br />
          []
        </para>
      </doc>,
    );
  });

  it('inside a list ', () => {
    const { view } = testEditor(
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, keybindings.insert);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>
              <br />
              []
            </para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('multiple hardBreaks ', () => {
    const { view } = testEditor(
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, keybindings.insert);
    sendKeyToPm(view, keybindings.insert);
    sendKeyToPm(view, keybindings.insert);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>
              <br />
              <br />
              <br />
              []
            </para>
          </li>
        </ul>
      </doc>,
    );
  });
});

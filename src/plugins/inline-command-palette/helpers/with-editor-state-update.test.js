import { withEditorStateUpdate } from './with-editor-state-update';
import React from 'react';

test('something', () => {
  const Comp = withEditorStateUpdate({})(() => <div>hi</div>);
  expect(Comp).toBeInstanceOf(Function);
});

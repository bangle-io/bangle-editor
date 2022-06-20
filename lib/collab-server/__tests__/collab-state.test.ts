import { defaultSpecs } from '@bangle.dev/all-base-components';
import { SpecRegistry } from '@bangle.dev/core';
import { Node, ReplaceStep, Slice } from '@bangle.dev/pm';

import { CollabState, MAX_STEP_HISTORY, StepBigger } from '../src/collab-state';

const specRegistry = new SpecRegistry([...defaultSpecs()]);

const rawDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'hello world!',
        },
      ],
    },
  ],
};

test('works', () => {
  const doc = specRegistry.schema.nodeFromJSON(rawDoc) as Node;
  const state = new CollabState(doc, [], 0);

  expect(state.doc).toEqual(doc);

  const step = new ReplaceStep(
    1,
    1,
    Slice.fromJSON(specRegistry.schema, {
      content: [
        {
          type: 'text',
          text: 'check',
        },
      ],
    }),
  );

  const newCollab = CollabState.addEvents(state, 0, [step], 'clientID');

  expect(newCollab.status).toBe('ok');
  expect(newCollab.collabState.doc.toString()).toEqual(
    `doc(paragraph("checkhello world!"))`,
  );
  expect(newCollab.collabState.version).toBe(1);
  expect(newCollab.collabState.steps).toEqual([step]);

  const events = CollabState.getEvents(newCollab.collabState, 0);
  expect(events.status).toBe('ok');
  expect(events.steps).toEqual([step]);
});

test('throws on invalid version', () => {
  const doc = specRegistry.schema.nodeFromJSON(rawDoc) as Node;
  const state = new CollabState(doc, [], 0);

  const step = new ReplaceStep(0, 0, Slice.empty);

  const newCollab = CollabState.addEvents(state, 1, [step], 'clientID');

  expect(newCollab).toMatchInlineSnapshot(`
      Object {
        "reason": "InvalidVersion",
        "status": "fail",
      }
    `);
});

test('throws outdated version', () => {
  const doc = specRegistry.schema.nodeFromJSON(rawDoc) as Node;
  const state = new CollabState(doc, [], 5);

  const step = new ReplaceStep(0, 0, Slice.empty);

  const newCollab = CollabState.addEvents(state, 3, [step], 'clientID');

  expect(newCollab).toMatchInlineSnapshot(`
        Object {
          "reason": "OutdatedVersion",
          "status": "fail",
        }
      `);
});

test('throws on unable to apply', () => {
  const doc = specRegistry.schema.nodeFromJSON(rawDoc) as Node;
  const state = new CollabState(doc, [], 0);

  const step = new ReplaceStep(
    0,
    0,
    Slice.fromJSON(specRegistry.schema, {
      content: [
        {
          type: 'text',
          text: 'check',
        },
      ],
    }),
  );

  const newCollab = CollabState.addEvents(state, 0, [step], 'clientID');

  expect(newCollab).toEqual({
    reason: 'ApplyFailed',
    status: 'fail',
  });
});

describe('getEvents', () => {
  test('throws error history not available', () => {
    const doc = specRegistry.schema.nodeFromJSON(rawDoc) as Node;
    const state = new CollabState(doc, [], 50000);

    const events = CollabState.getEvents(state, 0);
    expect(events.status).toBe('fail');
    expect(events.reason).toBe('HistoryNotAvailable');
  });

  test('throws error if invalid version', () => {
    const doc = specRegistry.schema.nodeFromJSON(rawDoc) as Node;
    const state = new CollabState(doc, [], 1);

    const events = CollabState.getEvents(state, 10);
    expect(events.status).toBe('fail');
    expect(events.reason).toBe('InvalidVersion');
  });
});

test('trims the step if exceeded', () => {
  const doc = specRegistry.schema.nodeFromJSON(rawDoc) as Node;
  const state = new CollabState(
    doc,
    Array.from({ length: MAX_STEP_HISTORY + 100 }, () => {
      const r: any = new ReplaceStep(0, 0, Slice.empty);
      r.clientID = 'clientID';
      return r as StepBigger;
    }),
    234,
  );

  expect(state.steps.length).toBe(MAX_STEP_HISTORY);
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { extensions } from 'bangle-play/app/editor/extensions';
import { getSchema } from 'bangle-play/app/editor/utils';
import { IndexDbWorkspace } from 'bangle-play/app/workspace/workspace';
import { IndexDbWorkspaceFile } from 'bangle-play/app/workspace/workspace-file';

import localforage from 'localforage';
import {
  workspaceActions,
  WorkspaceContext,
  WorkspaceContextProvider,
} from '../WorkspaceContext';

jest.mock('localforage', () => {
  const instance = {
    iterate: jest.fn(async () => {}),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
    getItem: jest.fn(async () => {}),
  };

  return {
    config: jest.fn(),
    createInstance: jest.fn(({ name } = {}) => {
      if (name === 'workspaces/1') {
        return {
          iterate: jest.fn(async () => {}),
          setItem: jest.fn(async () => {}),
          removeItem: jest.fn(async () => {}),
          getItem: jest.fn(async () => {}),
        };
      }
      return instance;
    }),
  };
});
const DateNowBackup = jest.fn();
describe('index db workspace', () => {
  let dbInstance;
  const schema = getSchema(extensions());
  beforeEach(async () => {
    Date.now = jest.fn(() => 1);
    dbInstance = localforage.createInstance();
    dbInstance.getItem = jest.fn(async (docName) => ({ docName, doc: null }));
    dbInstance.iterate.mockImplementationOnce(async (cb) => {
      Array.from({ length: 5 }, (_, k) =>
        cb(
          {
            docName: k + '',
            doc: null,
          },
          k + '',
          k,
        ),
      );
    });
  });
  afterEach(() => {
    Date.now = DateNowBackup;
  });
  test('Creates workspace correctly', async () => {
    await IndexDbWorkspace.createWorkspace('test_db', schema);
  });

  test('Adds files correctly', async () => {
    const workspace = await IndexDbWorkspace.createWorkspace('test_db', schema);

    expect(workspace.files).toMatchSnapshot();
  });

  test('getFile ', async () => {
    const workspace = await IndexDbWorkspace.createWorkspace('test_db', schema);

    expect(workspace.getFile('1')).toMatchInlineSnapshot(`
      Object {
        "doc": null,
        "docName": "1",
        "metadata": Object {
          "created": 1,
          "docName": "1",
          "modified": 1,
        },
      }
    `);
  });

  test('hasFile ', async () => {
    const workspace = await IndexDbWorkspace.createWorkspace('test_db', schema);

    expect(workspace.hasFile('2')).toBe(true);
  });

  test('link file', async () => {
    const workspace = await IndexDbWorkspace.createWorkspace('test_db', schema);

    const newFile = new IndexDbWorkspaceFile(
      'test_doc',
      null,
      {},
      { dbInstance: dbInstance, schema: schema },
    );

    let newWorkspace = workspace.linkFile(newFile);
    expect(workspace.hasFile('test_doc')).toBe(false);
    expect(newWorkspace.hasFile('test_doc')).toBe(true);
  });

  test('unlink file', async () => {
    const workspace = await IndexDbWorkspace.createWorkspace('test_db', schema);

    let newWorkspace = workspace.unlinkFile(workspace.getFile('2'));

    expect(workspace.hasFile('2')).toBe(true);
    expect(newWorkspace.hasFile('2')).toBe(false);
  });
});

describe('indexdb workspaceContext', () => {
  let dbInstance;
  const customRender = (child, { ...renderOptions } = {}) => {
    return render(
      <WorkspaceContextProvider>{child}</WorkspaceContextProvider>,
      renderOptions,
    );
  };

  beforeEach(async () => {
    Date.now = jest.fn(() => 1);
  });
  afterEach(() => {
    Date.now = DateNowBackup;
  });

  beforeEach(async () => {
    dbInstance = localforage.createInstance();
    dbInstance.getItem = jest.fn(async (docName) => ({ docName, doc: null }));
    dbInstance.iterate.mockImplementation(async (cb) => {
      Array.from({ length: 5 }, (_, k) =>
        cb(
          {
            docName: k + '',
            doc: null,
          },
          k + '',
          k,
        ),
      );
    });
  });

  test('sets up workspace', async () => {
    customRender(
      <WorkspaceContext.Consumer>
        {({ workspace }) =>
          workspace && (
            <span data-testid="result">
              Result: {workspace.files.map((f) => f.docName)}
            </span>
          )
        }
      </WorkspaceContext.Consumer>,
    );

    await waitFor(() => screen.getByTestId('result'));

    expect(screen.getByTestId('result').textContent).toMatchInlineSnapshot(
      `"Result: 01234"`,
    );
    expect(dbInstance.getItem).toBeCalledTimes(5);
  });

  test('has updateContext', async () => {
    customRender(
      <WorkspaceContext.Consumer>
        {({ updateContext } = {}) =>
          updateContext && (
            <span data-testid="result">{Boolean(updateContext)}</span>
          )
        }
      </WorkspaceContext.Consumer>,
    );

    await waitFor(() => screen.getByTestId('result'));

    expect(screen.getByTestId('result')).toBeTruthy();
  });

  test('has one openedDocuments initially', async () => {
    customRender(
      <WorkspaceContext.Consumer>
        {({ workspace, openedDocuments } = {}) => {
          if (!workspace) {
            return;
          }
          expect(openedDocuments.every((r) => r.docName)).toBe(true);
          expect(openedDocuments.every((r) => r.key)).toBe(true);
          return (
            <span data-testid="result">
              {openedDocuments.map((r) => r.docName)}
            </span>
          );
        }}
      </WorkspaceContext.Consumer>,
    );

    await waitFor(() => screen.getByTestId('result'));

    expect(screen.getByTestId('result')).toMatchInlineSnapshot(`
      <span
        data-testid="result"
      >
        0
      </span>
    `);
  });

  test('openWorkspaceFile', async () => {
    let _updateContext;
    customRender(
      <WorkspaceContext.Consumer>
        {({ workspace, openedDocuments, updateContext } = {}) => {
          if (!workspace) {
            return;
          }
          _updateContext = updateContext;
          return (
            <span data-testid="result">
              {openedDocuments.map((r) => r.docName)}
            </span>
          );
        }}
      </WorkspaceContext.Consumer>,
    );

    await waitFor(() => screen.getByTestId('result'));

    await _updateContext(workspaceActions.openWorkspaceFile('2'));

    expect(screen.getByTestId('result')).toMatchInlineSnapshot(`
      <span
        data-testid="result"
      >
        2
        0
      </span>
    `);

    // opening again should work
    await _updateContext(workspaceActions.openWorkspaceFile('2'));

    expect(screen.getByTestId('result').textContent).toMatchInlineSnapshot(
      `"22"`,
    );
  });

  test('openBlankWorkspaceFile', async () => {
    let _updateContext;
    let _openedDocuments;
    let _workspace;

    dbInstance.iterate.mockImplementation(async (cb) => {
      Array.from({ length: 2 }, (_, k) =>
        cb(
          {
            docName: k + '',
            doc: null,
          },
          k + '',
          k,
        ),
      );
    });

    dbInstance.getItem = jest.fn(async (docName) => {
      // we only give out 2 files in mock iterate
      if (['0', '1'].includes(docName)) {
        return {
          docName,
          doc: null,
        };
      }
    });

    customRender(
      <WorkspaceContext.Consumer>
        {({ workspace, openedDocuments, updateContext } = {}) => {
          if (!workspace) {
            return;
          }
          _workspace = workspace;
          _updateContext = updateContext;
          _openedDocuments = openedDocuments;
          return (
            <span data-testid="result">
              {openedDocuments.map((r) => r.docName)}
            </span>
          );
        }}
      </WorkspaceContext.Consumer>,
    );

    await waitFor(() => screen.getByTestId('result'));

    await _updateContext(workspaceActions.openBlankWorkspaceFile());

    expect(_openedDocuments.length).toBe(2);
    // its a random string
    expect(typeof _openedDocuments[0].docName === 'string').toBe(true);

    expect(_workspace.hasFile(_openedDocuments[0].docName)).toBe(true);
    expect(dbInstance.setItem).toHaveBeenNthCalledWith(
      1,
      _openedDocuments[0].docName,
      expect.any(Object),
    );
  });

  test('deleteWorkspaceFile', async () => {
    let _updateContext;
    let _openedDocuments;
    let _workspace;
    customRender(
      <WorkspaceContext.Consumer>
        {({ workspace, openedDocuments, updateContext } = {}) => {
          if (!workspace) {
            return;
          }
          _workspace = workspace;
          _updateContext = updateContext;
          _openedDocuments = openedDocuments;
          return (
            <span data-testid="result">
              {openedDocuments.map((r) => r.docName)}
            </span>
          );
        }}
      </WorkspaceContext.Consumer>,
    );

    await waitFor(() => screen.getByTestId('result'));

    await _updateContext(workspaceActions.openWorkspaceFile('2'));
    expect(_openedDocuments[0].docName).toBe('2');

    await _updateContext(workspaceActions.deleteWorkspaceFile('2'));

    expect(_openedDocuments.length).toBe(1);
    // its a random string
    expect(_openedDocuments[0].docName).toBe('0');

    expect(_workspace.hasFile(_openedDocuments[0].docName)).toBe(true);
    expect(dbInstance.removeItem).toBeCalledTimes(1);
    expect(dbInstance.removeItem).toHaveBeenNthCalledWith(1, '2');
  });
});

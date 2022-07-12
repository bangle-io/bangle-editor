import {
  getVersion,
  receiveTransaction,
  sendableSteps,
} from 'prosemirror-collab';
import { actions, assign, createMachine, interpret } from 'xstate';

import {
  CollabError,
  GetDocument,
  PullEvents,
  PushEvents,
  ValidErrorCodes,
} from '@bangle.dev/collab-server';
import {
  EditorView,
  Node,
  Schema,
  Selection,
  Step,
  TextSelection,
} from '@bangle.dev/pm';
import { assertNotUndefined } from '@bangle.dev/utils';

import { collabSettingsKey, replaceDocument } from './helpers';

const LOG = true;
let log = LOG ? console.log.bind(console, 'collab/collab-machine') : () => {};

type OnFatalError = (error: CollabError) => boolean;

export function collabMachineInterpreter(
  machine: ReturnType<typeof collabMachine>,
) {
  const instance = interpret(machine, {
    devTools: true,
    deferEvents: true,
  })
    .onTransition((state) => {
      console.log(
        `Collab machine transitioning from "${state.history?.value}" to "${state.value}"`,
        state.context,
      );
    })
    .onDone((state) => {
      log('done', state);
    });

  let stopped = false;
  const restart = () => {
    if (!stopped) {
      stopped = true;
      instance.stop();
    }

    stopped = false;
    instance.start();
  };
  return {
    isDestroyed: () => {
      if (stopped) {
        return true;
      }
      return instance.state.done;
    },
    start: () => {
      if (stopped) {
        throw new Error('Cant start a stopped machine');
      }
      return instance.start();
    },
    pushNewEvents: () => {
      console.warn('pushEvents');

      instance.send({
        type: 'PUSH_EVENTS',
      });
    },
    pullEvents: () => {
      console.warn('pullEvents');

      instance.send({
        type: 'PULL_EVENTS',
      });
    },
    stop: () => {
      stopped = true;
      return instance.stop();
    },
  };
}

type Services = {
  getDocumentService: {
    data: Awaited<ReturnType<GetDocument>>;
  };
  pullEventsService: {
    data: Awaited<ReturnType<PullEvents>>;
  };
  pushEventsService: {
    data: Awaited<ReturnType<PushEvents> | undefined>;
  };
};
type Context = {
  collabInfo?: {
    initialDoc: Node;
    initialVersion: number;
    managerId: string;
  };
  collabErrorInfo?: {
    error: CollabError;
    backoff: number;
  };
};

export function collabMachine({
  docName,
  clientID,
  userId,
  schema,
  getDocument,
  pullEvents,
  oldSelection,
  pushEvents,
  view,
}: {
  docName: string;
  clientID: string;
  userId: string;
  schema: Schema;
  view: EditorView;
  oldSelection?: TextSelection;
  getDocument: GetDocument;
  pullEvents: PullEvents;
  pushEvents: PushEvents;
}) {
  return createMachine(
    {
      strict: false,
      tsTypes: {} as import('./collab.machine.typegen').Typegen0,
      id: 'collab-client' + clientID,
      initial: 'init',
      context: {
        collabInfo: undefined,
        collabErrorInfo: undefined,
      },
      schema: {
        context: {} as Context,
        services: {} as Services,
      },
      states: {
        reset: {
          id: 'reset-collab',
          entry: 'resetCollabContextAction',
          always: [{ target: 'init' }],
        },
        init: {
          invoke: {
            id: 'get-document',
            src: 'getDocumentService',
            onDone: {
              target: 'initDocument',
              actions: 'processGetDocumentAction',
            },
            onError: {
              target: 'error',
              actions: 'saveError',
            },
          },
        },
        initDocument: {
          entry: 'initDocumentAction',
          always: [
            { target: 'destroyed', cond: 'isViewDestroyed' },
            { target: 'ready' },
          ],
        },
        ready: {
          entry: actions.send(
            { type: 'PULL_EVENTS' },
            {
              delay: 50,
              id: 'pullEventsPoll',
            },
          ),
          always: [{ target: 'destroyed', cond: 'isViewDestroyed' }],
          on: {
            PULL_EVENTS: [
              {
                actions: actions.cancel('pullEventsPoll'),
                target: 'pullEvents',
              },
            ],
            PUSH_EVENTS: [
              {
                actions: actions.cancel('pullEventsPoll'),
                target: 'pushEvents',
              },
            ],
          },
        },
        pushEvents: {
          on: {
            PULL_EVENTS: {
              target: 'pullEvents',
            },
          },
          invoke: {
            id: 'push-events',
            src: 'pushEventsService',
            onDone: {
              target: 'pullEvents',
              actions: 'processPushEventsAction',
            },
            onError: {
              target: 'error',
              actions: 'saveError',
            },
          },
        },
        pullEvents: {
          id: 'pull-events-state',
          invoke: {
            id: 'pull-events',
            src: 'pullEventsService',
            onDone: {
              target: 'ready',
              actions: 'processPullEventsAction',
            },
            onError: {
              target: 'error',
              actions: 'saveError',
            },
          },
        },
        error: {
          initial: 'errorTriage',
          states: {
            errorTriage: {
              always: [
                { target: 'errorApplyFailed', cond: 'isErrorApplyFailed' },
                {
                  target: 'errorDocumentNotFound',
                  cond: 'isErrorDocumentNotFound',
                },
                {
                  target: 'errorHistoryNotAvailable',
                  cond: 'isErrorHistoryNotAvailable',
                },
                {
                  target: 'errorIncorrectManager',
                  cond: 'isErrorIncorrectManager',
                },
                {
                  target: 'errorInvalidVersion',
                  cond: 'isErrorInvalidVersion',
                },
                {
                  target: 'errorOutdatedVersion',
                  cond: 'isErrorOutdatedVersion',
                },
              ],
            },
            errorApplyFailed: {
              after: [
                {
                  delay: (context) => {
                    assertNotUndefined(
                      context.collabErrorInfo,
                      'collabErrorInfo is undefined',
                    );
                    const recoveryBackOff = Math.min(
                      context.collabErrorInfo.backoff++ * 2,
                      6e6,
                    );
                    log('attempting recover', recoveryBackOff);
                    return context.collabErrorInfo.backoff;
                  },
                  target: '#pull-events-state',
                },
              ],
            },
            errorDocumentNotFound: {},
            errorHistoryNotAvailable: {},
            errorIncorrectManager: {},
            errorInvalidVersion: {
              always: {
                target: '#reset-collab',
              },
            },
            errorOutdatedVersion: {
              always: {
                target: '#pull-events-state',
              },
            },
          },
        },
        destroyed: {
          type: 'final',
        },
      },
    },
    {
      guards: {
        isViewDestroyed: () => view.isDestroyed,
        isErrorApplyFailed: makeCollabErrorGuard(500),
        isErrorDocumentNotFound: makeCollabErrorGuard(404),
        isErrorHistoryNotAvailable: makeCollabErrorGuard(410),
        isErrorIncorrectManager: makeCollabErrorGuard(410),
        isErrorInvalidVersion: makeCollabErrorGuard(400),
        isErrorOutdatedVersion: makeCollabErrorGuard(409),
      },
      actions: {
        resetCollabContextAction: (context: Context) => {
          context.collabInfo = undefined;
          context.collabErrorInfo = undefined;
        },
        initDocumentAction: (context: Context) => {
          assertNotUndefined(
            context.collabInfo,
            'initDocumentAction: collab must be defined',
          );
          applyDoc(
            view,
            context.collabInfo.initialDoc,
            context.collabInfo.initialVersion,
            oldSelection,
          );
        },
        processGetDocumentAction: assign({
          collabInfo: (_, { data }) => ({
            initialDoc: schema.nodeFromJSON(data.doc),
            managerId: data.managerId,
            initialVersion: data.version,
          }),
        }),
        processPullEventsAction: (context, event) => {
          assertNotUndefined(
            context.collabInfo,
            'processPullEventsAction: collab must be defined',
          );
          const { steps, clientIDs } = event.data;
          applySteps(view, {
            steps,
            clientIDs,
          });
        },
        processPushEventsAction: (context, event) => {
          assertNotUndefined(
            context.collabInfo,
            'processPushEventsAction: collab must be defined',
          );
        },
        saveError: assign({
          collabErrorInfo: (_, event) => {
            if (event.data instanceof CollabError) {
              return { error: event.data, backoff: 1 };
            }
            console.log(event.data);
            throw new Error('Rejected Unknown value');
          },
        }),
      },
      services: {
        pushEventsService: async (context) => {
          assertNotUndefined(
            context.collabInfo,
            'pushEventsService: collab must be defined',
          );

          const steps = sendableSteps(view.state);

          if (!steps) {
            return undefined;
          }

          return pushEvents({
            version: getVersion(view.state),
            steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
            // TODO  the default value numerical 0 before
            clientID: (steps ? steps.clientID : 0) + '',
            docName: docName,
            userId: userId,
            managerId: context.collabInfo.managerId,
          });
        },
        pullEventsService: (context: Context) => {
          assertNotUndefined(
            context.collabInfo,
            'pullEventsService: collab must be defined',
          );
          return pullEvents({
            docName,
            version: getVersion(view.state),
            userId: userId,
            managerId: context.collabInfo.managerId,
          });
        },
        getDocumentService: () =>
          getDocument({
            docName,
            userId,
          }),
      },
    },
  );
}

function applySteps(
  view: EditorView,
  payload: Awaited<ReturnType<PullEvents>>,
) {
  if (view.isDestroyed) {
    return;
  }
  // TODO name these steps as rawSteps
  // TODO make sure the data is always []
  const steps = (payload.steps ? payload.steps : []).map((j) =>
    Step.fromJSON(view.state.schema, j),
  );
  const clientIDs = payload.clientIDs ? payload.clientIDs : [];

  if (steps.length === 0) {
    log('no steps', payload, 'version', getVersion(view.state));
    return false;
  }

  const tr = receiveTransaction(view.state, steps, clientIDs)
    .setMeta('addToHistory', false)
    .setMeta('bangle/isRemote', true);
  const newState = view.state.apply(tr);
  view.updateState(newState);

  log('after apply version', getVersion(view.state));
  return;
}

function applyDoc(
  view: EditorView,
  doc: Node,
  version: number,
  oldSelection?: TextSelection,
) {
  if (view.isDestroyed) {
    return;
  }
  const prevSelection =
    view.state.selection instanceof TextSelection
      ? view.state.selection
      : undefined;

  let tr = replaceDocument(view.state, doc, version);
  const selection = oldSelection || prevSelection;
  if (selection) {
    let { from } = selection;
    if (from >= tr.doc.content.size) {
      tr = tr.setSelection(Selection.atEnd(tr.doc));
    } else {
      tr = tr.setSelection(Selection.near(tr.doc.resolve(from)));
    }
  }

  const newState = view.state.apply(
    tr
      .setMeta('bangle/isRemote', true)
      .setMeta('bangle/allowUpdatingEditorState', true),
  );

  view.updateState(newState);
  view.dispatch(view.state.tr.setMeta(collabSettingsKey, { ready: true }));
}

function makeCollabErrorGuard(errorCode: ValidErrorCodes) {
  return (context: Context): boolean => {
    assertNotUndefined(context.collabErrorInfo, 'collabError must be defined');
    console.log(
      `Validating error code ${errorCode} and received ${context.collabErrorInfo.error.errorCode}`,
    );
    return context.collabErrorInfo.error.errorCode === errorCode;
  };
}

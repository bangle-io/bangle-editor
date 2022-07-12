// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  'eventsCausingActions': {
    processGetDocumentAction: 'done.invoke.get-document';
    saveError:
      | 'error.platform.get-document'
      | 'error.platform.push-events'
      | 'error.platform.pull-events';
    processPushEventsAction: 'done.invoke.push-events';
    processPullEventsAction: 'done.invoke.pull-events';
    resetCollabContextAction: '';
    initDocumentAction: 'done.invoke.get-document';
  };
  'internalEvents': {
    'done.invoke.get-document': {
      type: 'done.invoke.get-document';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.get-document': {
      type: 'error.platform.get-document';
      data: unknown;
    };
    'error.platform.push-events': {
      type: 'error.platform.push-events';
      data: unknown;
    };
    'error.platform.pull-events': {
      type: 'error.platform.pull-events';
      data: unknown;
    };
    'done.invoke.push-events': {
      type: 'done.invoke.push-events';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.pull-events': {
      type: 'done.invoke.pull-events';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  'invokeSrcNameMap': {
    getDocumentService: 'done.invoke.get-document';
    pushEventsService: 'done.invoke.push-events';
    pullEventsService: 'done.invoke.pull-events';
  };
  'missingImplementations': {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  'eventsCausingServices': {
    getDocumentService: '';
    pullEventsService: 'PULL_EVENTS' | 'done.invoke.push-events' | '';
    pushEventsService: 'PUSH_EVENTS';
  };
  'eventsCausingGuards': {
    isViewDestroyed: '';
    isErrorApplyFailed: '';
    isErrorDocumentNotFound: '';
    isErrorHistoryNotAvailable: '';
    isErrorIncorrectManager: '';
    isErrorInvalidVersion: '';
    isErrorOutdatedVersion: '';
  };
  'eventsCausingDelays': {};
  'matchesStates':
    | 'reset'
    | 'init'
    | 'initDocument'
    | 'ready'
    | 'pushEvents'
    | 'pullEvents'
    | 'error'
    | 'error.errorTriage'
    | 'error.errorApplyFailed'
    | 'error.errorDocumentNotFound'
    | 'error.errorHistoryNotAvailable'
    | 'error.errorIncorrectManager'
    | 'error.errorInvalidVersion'
    | 'error.errorOutdatedVersion'
    | 'destroyed'
    | {
        error?:
          | 'errorTriage'
          | 'errorApplyFailed'
          | 'errorDocumentNotFound'
          | 'errorHistoryNotAvailable'
          | 'errorIncorrectManager'
          | 'errorInvalidVersion'
          | 'errorOutdatedVersion';
      };
  'tags': never;
}

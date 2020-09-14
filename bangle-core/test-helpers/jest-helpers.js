import { Node } from 'prosemirror-model';
import prettier from 'prettier';
import { NodeSelection } from 'prosemirror-state';
import { getDocLabels } from './schema-builders';

global.db = function db(fn) {
  return (...args) => {
    debugger;
    return fn(...args);
  };
};

export const jestExpect = {
  toEqualDocAndSelection,
  toEqualDocument(actual, expected) {
    return toEqualDocument(
      this.equals,
      this.utils,
      this.expand,
    )(actual, expected);
  },
};

expect.extend(jestExpect);
stubMissingDOMAPIs();

function toEqualDocAndSelection(actual, expected) {
  const { doc: actualDoc, selection: actualSelection } = actual;
  const docComparison = toEqualDocument(
    this.equals,
    this.utils,
    this.expand,
  )(actualDoc, expected);
  if (!docComparison.pass) {
    return docComparison;
  }

  expected =
    typeof expected === 'function' && actualDoc.type && actualDoc.type.schema
      ? expected(actualDoc.type.schema)
      : expected;

  const fail = {
    pass: false,
    actual,
    expected,
    name: 'toEqualDocumentAndSelection',
    message: () => 'Expected specified selections to match in both values.',
  };

  const posLabels = getDocLabels(expected);
  if (posLabels) {
    const refConditions = {
      '[': (position, selection) => position === selection.$from.pos,
      ']': (position, selection) => position === selection.$to.pos,
      '[]': (position, selection) =>
        position === selection.$from.pos && position === selection.$to.pos,
      '<node>': (position, selection) =>
        selection instanceof NodeSelection && position === selection.$from.pos,
      // The | denotes the gap cursor's side, based on the node on the side of the |.
      '<|gap>': (position, selection) =>
        // Using literal values from constructor as unable to import type from editor-core
        // Some tests use mock packages which will conflict with jestFrameworkSetup.js
        selection.constructor.name === 'GapCursorSelection' &&
        selection.side === 'right' &&
        position === selection.$from.pos,
      '<gap|>': (position, selection) =>
        selection.constructor.name === 'GapCursorSelection' &&
        selection.side === 'left' &&
        position === selection.$from.pos,
    };

    if (
      !Object.keys(refConditions).every((key) => {
        if (key in posLabels) {
          return refConditions[key](posLabels[key], actualSelection);
        }
        return true;
      })
    ) {
      return fail;
    }
  }

  return docComparison;
}

function toEqualDocument(equals, utils, expand) {
  return (actual, expected) => {
    // Because schema is created dynamically, expected value is a function (schema) => PMNode;
    // That's why this magic is necessary. It simplifies writing assertions, so
    // instead of expect(doc).toEqualDocument(doc(p())(schema)) we can just do:
    // expect(doc).toEqualDocument(doc(p())).
    //
    // Also it fixes issues that happens sometimes when actual schema and expected schema
    // are different objects, making this case impossible by always using actual schema to create expected node.
    expected =
      typeof expected === 'function' && actual.type && actual.type.schema
        ? expected(actual.type.schema)
        : expected;

    if (!(expected instanceof Node) || !(actual instanceof Node)) {
      return {
        pass: false,
        actual,
        expected,
        name: 'toEqualDocument',
        message: () =>
          'Expected both values to be instance of prosemirror-model Node.',
      };
    }

    if (expected.type.schema !== actual.type.schema) {
      return {
        pass: false,
        actual,
        expected,
        name: 'toEqualDocument',
        message: () => 'Expected both values to be using the same schema.',
      };
    }
    const frmt = (doc) =>
      prettier.format(doc.toString(), {
        semi: false,
        parser: 'babel',
        printWidth: 40,
        singleQuote: true,
      });

    const actualJSON = actual.toJSON();
    const expectedJSON = expected.toJSON();
    const actualFormatted = frmt(actual);
    const expectedFormatted = frmt(expected);
    const pass = equals(actualJSON, expectedJSON);
    const message = pass
      ? () =>
          `${utils.matcherHint('.not.toEqualDocument')}\n\n` +
          `Expected JSON value of document to not equal:\n  ${utils.printExpected(
            expectedJSON,
          )}\n` +
          `Actual JSON:\n  ${utils.printReceived(actualJSON)}`
      : () => {
          let diffString;
          if (expectedFormatted === actualFormatted) {
            diffString = utils.diff(expectedJSON, actualJSON, {
              expand: expand,
            });
          } else {
            diffString = utils.diff(expectedFormatted, actualFormatted, {
              expand: expand,
            });
          }

          return (
            `${utils.matcherHint('.toEqualDocument')}\n\n` +
            `Expected Tree value of document to equal:\n${expectedFormatted}\n` +
            `Actual Tree:\n  ${actualFormatted}` +
            `${diffString ? `\n\nDifference:\n\n${diffString}` : ''}`
          );
        };

    return {
      pass,
      actual: actualJSON,
      expected: expectedJSON,
      message,
      name: 'toEqualDocument',
    };
  };
}

function stubMissingDOMAPIs() {
  const warnOnce = (() => {
    return () => {
      // eslint-disable-next-line no-console
      // console.warn(
      //   'Warning! Test depends on DOM selection API which is not supported in JSDOM/Node environment.',
      // );
      // window.hasWarnedAboutJsdomFixtures = true;
    };
  })();

  const clientRectFixture = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };

  const selectionFixture = {
    removeAllRanges: () => {},
    addRange: () => {},
  };

  const rangeFixture = {
    setEnd: () => {},
    setStart: () => {},
    collapse: () => {},
    getClientRects: () => [],
    getBoundingClientRect: () => clientRectFixture,
  };

  Object.defineProperty(rangeFixture, 'commonAncestorContainer', {
    enumerable: true,
    get: () => {
      return document.body;
    },
  });

  if (typeof window !== 'undefined') {
    window.getSelection = () => {
      warnOnce();
      return selectionFixture;
    };
  }

  if (typeof document !== 'undefined') {
    document.getSelection = () => {
      warnOnce();
      return selectionFixture;
    };

    // Do nothing when attempting to create DOM ranges
    document.createRange = () => {
      warnOnce();
      return rangeFixture;
    };

    if (!('getClientRects' in document.createElement('div'))) {
      Element.prototype.getClientRects = () => [];
      Element.prototype.getBoundingClientRect = () => clientRectFixture;
    }
  }

  if (typeof window !== 'undefined') {
    // Replace the native InputEvent which ships with JSDOM 12+
    window.InputEvent = class InputEvent {
      constructor(typeArg, inputEventInit) {
        const uiEvent = new UIEvent(typeArg, inputEventInit);
        uiEvent.inputType = (inputEventInit && inputEventInit.inputType) || '';
        uiEvent.isComposing =
          (inputEventInit && inputEventInit.isComposing) || false;
        uiEvent.data = (inputEventInit && inputEventInit.data) || null;
        return uiEvent;
      }
    };

    window.scrollBy = () => {};
  }
}

import {
  EditorState,
  Node,
  NodeSelection,
  Schema,
  Selection,
} from '@bangle.dev/pm';
import prettier from 'prettier';
import { getDocLabels } from './schema-builders';

export const jestExpect = {
  toEqualDocAndSelection,
  toEqualDocument<T>(this: jest.MatcherUtils, actual: T, expected: T) {
    return toEqualDocument(
      this.equals,
      this.utils,
      this.expand,
    )(actual, expected);
  },
};

expect.extend(jestExpect);
stubMissingDOMAPIs();

function toEqualDocAndSelection(
  this: jest.MatcherUtils,
  actual: EditorState,
  expected: (schema: Schema) => Node | Node,
) {
  const { doc: actualDoc, selection: actualSelection } = actual;
  const docComparison = toEqualDocument(
    this.equals,
    this.utils,
    this.expand,
  )(actualDoc, expected);
  if (!docComparison.pass) {
    return docComparison;
  }

  let normalizeExpected: any =
    typeof expected === 'function' && actualDoc.type && actualDoc.type.schema
      ? expected(actualDoc.type.schema)
      : expected;

  const fail = {
    pass: false,
    actual,
    normalizeExpected,
    name: 'toEqualDocumentAndSelection',
    message: () => 'Expected specified selections to match in both values.',
  };

  const posLabels = getDocLabels(normalizeExpected);
  if (posLabels) {
    const refConditions = {
      '[': (position: number, selection: Selection) =>
        position === selection.$from.pos,
      ']': (position: number, selection: Selection) =>
        position === selection.$to.pos,
      '[]': (position: number, selection: Selection) =>
        position === selection.$from.pos && position === selection.$to.pos,
      '<node>': (position: number, selection: Selection) =>
        selection instanceof NodeSelection && position === selection.$from.pos,
      // The | denotes the gap cursor's side, based on the node on the side of the |.
      '<|gap>': (position: number, selection: Selection) =>
        // Using literal values from constructor as unable to import type from editor-core
        // Some tests use mock packages which will conflict with jestFrameworkSetup.js
        selection.constructor.name === 'GapCursorSelection' &&
        (selection as any).side === 'right' &&
        position === selection.$from.pos,
      '<gap|>': (position: number, selection: Selection) =>
        selection.constructor.name === 'GapCursorSelection' &&
        (selection as any).side === 'left' &&
        position === selection.$from.pos,
    };

    if (
      !Object.keys(refConditions).every((key: string) => {
        if (key in posLabels) {
          return (refConditions as any)[key](posLabels[key], actualSelection);
        }
        return true;
      })
    ) {
      return fail;
    }
  }

  return docComparison;
}

function toEqualDocument(equals: any, utils: any, expand: any) {
  return (actual: any, expected: any) => {
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
    const frmt = (doc: Node) =>
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
    (window as any).getSelection = () => {
      return selectionFixture;
    };
  }

  if (typeof document !== 'undefined') {
    (document as any).getSelection = () => {
      return selectionFixture;
    };

    (document as any).createRange = () => {
      return rangeFixture;
    };

    if (!('getClientRects' in document.createElement('div'))) {
      (Element.prototype.getClientRects as any) = () => [];
      (Element.prototype.getBoundingClientRect as any) = () =>
        clientRectFixture;
    }
  }

  if (typeof window !== 'undefined') {
    // Replace the native InputEvent which ships with JSDOM 12+
    (window as any).InputEvent = class InputEvent {
      constructor(typeArg: any, inputEventInit: any) {
        const uiEvent: any = new UIEvent(typeArg, inputEventInit);
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

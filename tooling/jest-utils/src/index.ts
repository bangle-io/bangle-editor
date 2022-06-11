/// <reference path="./missing-test-types.d.ts" />
import { Node, NodeSelection } from '@bangle.dev/pm';
import { getDocLabels } from '@bangle.dev/test-helpers';
import prettier from 'prettier';
import type { Selection } from '@bangle.dev/pm';

globalThis.DOMRect = class DOMRect {
  bottom = 0;
  left = 0;
  right = 0;
  top = 0;
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {}
  static fromRect(other: DOMRect) {
    return new DOMRect(other.x, other.y, other.width, other.height);
  }
  toJSON() {
    return JSON.stringify(this);
  }
};

export const jestExpect = {
  toEqualDocAndSelection,
  toEqualDocument(actual: any, expected: any): any {
    const _this = this as any;
    return toEqualDocument(
      _this.equals,
      _this.utils,
      _this.expand,
    )(actual, expected);
  },
};

expect.extend(jestExpect);
stubMissingDOMAPIs();

function toEqualDocAndSelection(actual: any, expected: any) {
  const { doc: actualDoc, selection: actualSelection } = actual;
  // @ts-expect-error
  const _this = this;

  const docComparison = toEqualDocument(
    _this.equals,
    _this.utils,
    _this.expand,
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

    const keys = Object.keys(refConditions) as (keyof typeof refConditions)[];

    if (
      !keys.every((key) => {
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
      Element.prototype.getClientRects = () => [] as any;
      Element.prototype.getBoundingClientRect = () => clientRectFixture as any;
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

import { Node } from 'prosemirror-model';

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

  if (expected.refs) {
    const refConditions = {
      '<': (position, selection) => position === selection.$from.pos,
      '>': (position, selection) => position === selection.$to.pos,
      '<>': (position, selection) =>
        position === selection.$from.pos && position == selection.$to.pos,
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
        if (key in expected.refs) {
          return refConditions[key](expected.refs[key], actualSelection);
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

    const pass = equals(actual.toJSON(), expected.toJSON());
    const message = pass
      ? () =>
          `${utils.matcherHint('.not.toEqualDocument')}\n\n` +
          `Expected JSON value of document to not equal:\n  ${utils.printExpected(
            expected,
          )}\n` +
          `Actual JSON:\n  ${utils.printReceived(actual)}`
      : () => {
          const diffString = utils.diff(expected, actual, {
            expand: expand,
          });
          return (
            `${utils.matcherHint('.toEqualDocument')}\n\n` +
            `Expected JSON value of document to equal:\n${utils.printExpected(
              expected,
            )}\n` +
            `Actual JSON:\n  ${utils.printReceived(actual)}` +
            `${diffString ? `\n\nDifference:\n\n${diffString}` : ''}`
          );
        };

    return {
      pass,
      actual,
      expected,
      message,
      name: 'toEqualDocument',
    };
  };
}

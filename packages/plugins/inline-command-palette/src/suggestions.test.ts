import { schema } from 'prosemirror-schema-basic';
import { triggerCharacter } from './suggestions';

const CUR = '\u2038';

function createPosition(text) {
  const position = text.indexOf(CUR) + 1;
  const stripped = text.replace(CUR, '');

  expect(position).toBeGreaterThan(0);
  expect(position).toBeLessThanOrEqual(stripped.length + 1);

  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text(stripped)])
  ]);

  return doc.resolve(position);
}

function mention(text) {
  const $position = createPosition(text);

  return triggerCharacter('@', { allowSpaces: true })($position);
}

function tag(text) {
  const $position = createPosition(text);

  return triggerCharacter('#', { allowSpaces: false })($position);
}

describe('the triggerCharacter matcher', () => {
  it('will match when cursor is immediately after a node', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.node('hard_break'),
        schema.text('@mention')
      ])
    ]);

    const $position = doc.resolve(3);
    const result = triggerCharacter('@', { allowSpaces: true })($position);

    expect(result).toMatchObject({
      text: '@mention'
    });
  });

  describe(`for tags`, () => {
    it(`won't match "${CUR}#"`, () => {
      const text = `${CUR}#`;

      expect(tag(text)).toBeUndefined();
    });

    it(`will match "#${CUR}"`, () => {
      const text = `#${CUR}`;

      expect(tag(text)).toMatchObject({
        text: '#'
      });
    });

    it(`won't match "${CUR}#tag"`, () => {
      const text = `${CUR}#tag`;

      expect(tag(text)).toBeUndefined();
    });

    it(`will match "#${CUR}tag"`, () => {
      const text = `#${CUR}tag`;

      expect(tag(text)).toMatchObject({
        text: '#tag',
        range: { from: 1, to: 5 }
      });
    });

    it(`will match "#tag-with-dashes${CUR}"`, () => {
      const text = `#tag-with-dashes${CUR}`;

      expect(tag(text)).toMatchObject({
        text: '#tag-with-dashes'
      });
    });

    it(`won't match "#tag with spaces${CUR}"`, () => {
      const text = `#tag with spaces${CUR}`;

      expect(tag(text)).toBeUndefined();
    });

    it(`won't match "#tag#with#hashes${CUR}"`, () => {
      const text = `#tag#with#hashes${CUR}`;

      expect(tag(text)).toBeUndefined();
    });

    it(`will match "#multiple${CUR} #tags #separately"`, () => {
      const text = `#multiple${CUR} #tags #separately`;

      expect(tag(text)).toMatchObject({
        text: '#multiple'
      });
    });

    it(`will match "#multiple #tags${CUR} #separately"`, () => {
      const text = `#multiple #tags${CUR} #separately`;

      expect(tag(text)).toMatchObject({
        text: '#tags'
      });
    });

    it(`will match "#multiple #tags #separately${CUR}"`, () => {
      const text = `#multiple #tags #separately${CUR}`;

      expect(tag(text)).toMatchObject({
        text: '#separately'
      });
    });

    it(`won't match "#multiple ${CUR}#tags" when cursor is outside`, () => {
      const text = `#multiple ${CUR}#tags`;

      expect(tag(text)).toBeUndefined();
    });
  });

  describe('for mentions', () => {
    it(`won't match "${CUR}@"`, () => {
      const text = `${CUR}@`;

      expect(mention(text)).toBeUndefined();
    });

    it(`will match "@${CUR}"`, () => {
      const text = `@${CUR}`;

      expect(mention(text)).toMatchObject({
        text: '@'
      });
    });

    it(`won't match "${CUR}@mention"`, () => {
      const text = `${CUR}@mention`;

      expect(mention(text)).toBeUndefined();
    });

    it(`will match "@${CUR}mention"`, () => {
      const text = `@${CUR}mention`;

      expect(mention(text)).toMatchObject({
        text: '@mention',
        range: { from: 1, to: 9 }
      });
    });

    it(`will match "@m${CUR}ention"`, () => {
      const text = `@m${CUR}ention`;

      expect(mention(text)).toMatchObject({
        text: '@mention'
      });
    });

    it(`will match "@mention${CUR}"`, () => {
      const text = `@mention${CUR}`;

      expect(mention(text)).toMatchObject({
        text: '@mention'
      });
    });

    it(`will match "@mention ${CUR}"`, () => {
      const text = `@mention ${CUR}`;

      expect(mention(text)).toMatchObject({
        text: '@mention '
      });
    });

    it(`will match "@mentions with${CUR} spaces"`, () => {
      const text = `@mentions with${CUR} spaces`;

      expect(mention(text)).toMatchObject({
        text: '@mentions with spaces'
      });
    });

    it(`will match "@${CUR}mentions with spaces"`, () => {
      const text = `@${CUR}mentions with spaces`;

      expect(mention(text)).toMatchObject({
        text: '@mentions with spaces'
      });
    });

    it(`will match "@multiple ${CUR}@mentions"`, () => {
      const text = `@multiple ${CUR}@mentions`;

      expect(mention(text)).toMatchObject({
        text: '@multiple '
      });
    });

    it(`will match "@multiple @${CUR}mentions"`, () => {
      const text = `@multiple @${CUR}mentions`;

      expect(mention(text)).toMatchObject({
        text: '@mentions'
      });
    });

    it(`will match "mentions with text @${CUR}before them"`, () => {
      const text = `mentions with text @${CUR}before them`;

      expect(mention(text)).toMatchObject({
        text: '@before them'
      });
    });

    it(`will match "@${CUR}mentioned@email.address"`, () => {
      const text = `@${CUR}mentioned@email.address`;

      expect(mention(text)).toMatchObject({
        text: '@mentioned@email.address'
      });
    });

    it(`won't match "normal@${CUR}email.address"`, () => {
      const text = `normal@${CUR}email.address`;

      expect(mention(text)).toBeUndefined();
    });
  });
});

import '@bangle.dev/core/style.css';
import '@bangle.dev/tooltip/style.css';
import '@bangle.dev/react-menu/style.css';
import React from 'react';
import { BangleEditor, useEditorState } from '@bangle.dev/react';
import { PluginKey } from '@bangle.dev/core';
import { corePlugins, coreSpec } from '@bangle.dev/core/utils/core-components';
import { floatingMenu, FloatingMenu } from '@bangle.dev/react-menu';

const menuKey = new PluginKey('menuKey');
export default function Example() {
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      ...corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
      }),
    ],
    initialValue: getContent(),
  });

  return (
    <BangleEditor state={editorState}>
      <FloatingMenu menuKey={menuKey} />
    </BangleEditor>
  );
}

function getContent() {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'H2 Heading',
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 3,
        },
        content: [
          {
            type: 'text',
            text: 'H3 Heading',
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Marks',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [
              {
                type: 'italic',
              },
            ],
            text: 'italic',
          },
          {
            type: 'text',
            text: ', ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'bold',
              },
            ],
            text: 'Bold',
          },
          {
            type: 'text',
            text: ', ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'italic',
              },
            ],
            text: 'underlined',
          },
          {
            type: 'text',
            text: ', ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'strike',
              },
            ],
            text: 'striked',
          },
          {
            type: 'text',
            text: ', ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'code',
              },
            ],
            text: 'code',
          },
          {
            type: 'text',
            text: ', ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://en.wikipedia.org/wiki/Main_Page',
                },
              },
            ],
            text: 'link',
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'GFM Todo Lists',
          },
        ],
      },
      {
        type: 'todoList',
        content: [
          {
            type: 'todoItem',
            attrs: {
              done: true,
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Check out bangle.dev',
                  },
                ],
              },
            ],
          },
          {
            type: 'todoItem',
            attrs: {
              done: false,
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Walk the cat',
                  },
                ],
              },
            ],
          },
          {
            type: 'todoItem',
            attrs: {
              done: false,
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Drag these lists by dragging the square up or down.',
                  },
                ],
              },
            ],
          },
          {
            type: 'todoItem',
            attrs: {
              done: false,
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Move these lists with shortcut ',
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code',
                      },
                    ],
                    text: 'Option-ArrowUp',
                  },
                  {
                    type: 'text',
                    text:
                      '. You can move any node (yes headings too) with this shortcut.',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Unordered Lists',
          },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'This is an ordered list',
                  },
                ],
              },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'I am a nested ordered list',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'I am another nested one',
                          },
                        ],
                      },
                      {
                        type: 'bulletList',
                        content: [
                          {
                            type: 'listItem',
                            content: [
                              {
                                type: 'paragraph',
                                content: [
                                  {
                                    type: 'text',
                                    text: 'Bunch of nesting right?',
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Ordered Lists',
          },
        ],
      },
      {
        type: 'orderedList',
        attrs: {
          order: 1,
        },
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Bringing order to the world.',
                  },
                ],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Nobody remembers who came second.',
                  },
                ],
              },
              {
                type: 'orderedList',
                attrs: {
                  order: 1,
                },
                content: [
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'We can cheat to become first by nesting.',
                          },
                        ],
                      },
                      {
                        type: 'bulletList',
                        content: [
                          {
                            type: 'listItem',
                            content: [
                              {
                                type: 'paragraph',
                                content: [
                                  {
                                    type: 'text',
                                    text:
                                      'Oh an you can mix and match ordered unordered.',
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Image',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'You can also directly paste images.\n',
          },
          {
            type: 'image',
            attrs: {
              src:
                'https://user-images.githubusercontent.com/6966254/101979122-f4405e80-3c0e-11eb-9bf8-9af9b1ddc94f.png',
              alt: null,
              title: null,
            },
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Blockquote',
          },
        ],
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I am a blockquote, trigger me by typing > on a new line',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Code Block',
          },
        ],
      },
      {
        type: 'codeBlock',
        attrs: {
          language: '',
        },
        content: [
          {
            type: 'text',
            text:
              "// This is a code block\nfunction foo() {\n  console.log('Hello world!')\n}",
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Paragraph',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'I am a boring paragraph',
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
        },
        content: [
          {
            type: 'text',
            text: 'Horizontal Break',
          },
        ],
      },
      {
        type: 'horizontalRule',
      },
    ],
  };
}

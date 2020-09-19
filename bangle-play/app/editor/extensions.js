import Dinos from 'bangle-plugins/dinos';
import Emoji from 'bangle-plugins/emoji';
import { History } from 'bangle-core/extensions';
import { Bold, Code, Italic, Link, Strike, Underline } from 'bangle-core/marks';
import {
  Blockquote,
  BulletList,
  CodeBlock,
  HardBreak,
  Heading,
  HorizontalRule,
  ListItem,
  OrderedList,
  TodoItem,
  TodoList,
  Image,
} from 'bangle-core/nodes/index';
import StopwatchExtension from 'bangle-plugins/stopwatch/stopwatch';
import { Timestamp } from 'bangle-plugins/timestamp';
import { TrailingNode } from 'bangle-plugins/trailing-node';
import { SelectionTooltip } from 'bangle-plugins/selection-tooltip/index';
import 'bangle-plugins/selection-tooltip/selection-tooltip.css';

export function extensions() {
  return [
    new Bold(),
    new Code(),
    new Italic(),
    new Link(),
    new Strike(),
    new Underline(),
    new Blockquote(),
    new BulletList(),
    new CodeBlock(),
    new HardBreak(),
    new Heading({
      levels: [1, 2, 3],
    }),
    new HorizontalRule(),
    new ListItem(),
    new TodoItem(),
    new TodoList(),
    new OrderedList(),
    new Image(),
    new Dinos(),
    new Emoji(),
    new History(),
    new TrailingNode(),
    new StopwatchExtension(),
    new Timestamp(),
    new SelectionTooltip({
      tooltipContent: (view) => {
        const tooltipContent = document.createElement('div');
        tooltipContent.textContent = 'hello world';
        return tooltipContent;
      },
    }),
  ];
}

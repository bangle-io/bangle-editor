import '../setup/entry.css';

import basicEditor from './basic-editor/entry';
import collabEditor from './collab-editor/entry';
import lists from './lists/entry';
import reactMenu from './react-menu/entry';
import reactSticker from './react-sticker/entry';
import todoList from './todo-list/entry';

const pathname = window.location.pathname.slice(1);

switch (pathname) {
  case 'basic-editor': {
    basicEditor();
    break;
  }
  case 'collab-editor': {
    collabEditor();
    break;
  }
  case 'lists': {
    lists();
    break;
  }
  case 'react-menu': {
    reactMenu();
    break;
  }
  case 'react-sticker': {
    reactSticker();
    break;
  }
  case 'todo-list': {
    todoList();
    break;
  }
  default: {
    throw new Error('Unknown pathname: ' + window.location.pathname);
  }
}

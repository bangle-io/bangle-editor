// polyfills
import 'core-js/es/object/from-entries';

import React from 'react';
import { ProsemirrorComp } from './FirstComponent';
import './style.scss';

function App() {
  return <div className="App">{<ProsemirrorComp />}</div>;
}

export default App;

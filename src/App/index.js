// polyfills
import 'core-js/es/object/from-entries';

import './style.scss';

import React from 'react';

import { ProsemirrorComp } from './FirstComponent';

function App() {
  return (
    <div className="App">
      <ProsemirrorComp />
    </div>
  );
}

export default App;

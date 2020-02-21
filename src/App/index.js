// polyfills
import 'core-js/es/object/from-entries';

import React from 'react';
import { ProsemirrorComp } from './FirstComponent';
import './style.scss';
import { PortalRenderer, PortalProvider } from './portal';

function App() {
  return (
    <div className="App">
      <PortalProvider
        render={(portalProviderAPI) => (
          <>
            <ProsemirrorComp portalProviderAPI={portalProviderAPI} />
            {/* {this.state.editor ? (
              <PortalRenderer portalProviderAPI={portalProviderAPI} />
            ) : null} */}
          </>
        )}
      />
    </div>
  );
}

export default App;

declare module '@bangle.dev/core/test-helpers/test-helpers' {
  export const psx: any;
  export const renderTestEditor: any;
}

declare module '@bangle.dev/core/test-helpers/default-components' {
  export const defaultSpecs: any;
}

namespace JSX {
  export interface IntrinsicElements {
    para: any;
    doc: any;
    heading: any;
  }
}

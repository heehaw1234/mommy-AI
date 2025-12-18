declare module 'react' {
  interface ReactElement<
    P = any,
    T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>
  > {
    type: T;
    props: P;
    key: Key | null;
  }
}

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
  }
}

export {};

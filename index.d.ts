export interface options {
  dirPath: string;
  parseOptions?: Object;
  interceptor?: (marked: Function, markdownString: string) => string | Object;
  dist: {
    mode: 'export' | 'localStorage' | 'sessionStorage' | 'variable';
    path?: string
  };
}
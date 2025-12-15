declare module 'global-agent' {
  export function bootstrap(): void;
}

declare global {
  namespace NodeJS {
    interface Global {
      GLOBAL_AGENT: {
        HTTP_PROXY: string;
        HTTPS_PROXY: string;
        NO_PROXY: string;
      };
    }
  }

  // For Node.js 16+
  var GLOBAL_AGENT: {
    HTTP_PROXY: string;
    HTTPS_PROXY: string;
    NO_PROXY: string;
  };
}

export {};

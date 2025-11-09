/// <reference types="vite/client" />

// Polyfills for Node.js modules that Supabase realtime-js tries to import
declare global {
  var global: typeof globalThis;
  var Buffer: any;
}

declare module 'stream' {
  export * from 'stream-browserify';
}

declare module 'http' {
  export * from 'http-browserify';
}

declare module 'https' {
  export * from 'https-browserify';
}

declare module 'url' {
  export * from 'url-polyfill';
}

declare module 'zlib' {
  export * from 'zlib-browserify';
}

declare module 'buffer' {
  export * from 'buffer';
}

declare module 'util' {
  export * from 'util-browserify';
}

declare module 'events' {
  export * from 'events-browserify';
}

declare module 'assert' {
  export * from 'assert-browserify';
}
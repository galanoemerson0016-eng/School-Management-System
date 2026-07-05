/// <reference types="vite/client" />

// Vite `?inline` asset imports resolve to base64 data URI strings.
// vite/client only types plain asset imports, so declare the query variants used here.
declare module '*.ttf?inline' {
  const src: string;
  export default src;
}
declare module '*.TTF?inline' {
  const src: string;
  export default src;
}
declare module '*.png?inline' {
  const src: string;
  export default src;
}

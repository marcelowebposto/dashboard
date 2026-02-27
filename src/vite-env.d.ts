/// <reference types="vite/client" />

declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TOKEN_ENDPOINT: string;
  readonly VITE_CHAVE: string;
  readonly VITE_UNIDADE_NEGOCIO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

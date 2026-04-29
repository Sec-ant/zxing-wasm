/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly NPM_PACKAGE_VERSION: string;
  readonly READER_HASH: string;
  readonly WRITER_HASH: string;
  readonly FULL_HASH: string;
  readonly SUBMODULE_COMMIT: string;
}

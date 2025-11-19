declare module "download-git-repo" {
  type Callback = (error: Error | null) => void;

  interface Options {
    clone?: boolean;
    headers?: Record<string, string>;
  }

  function download(repo: string, destination: string, callback: Callback): void;
  function download(
    repo: string,
    destination: string,
    options: Options,
    callback: Callback
  ): void;

  export = download;
}




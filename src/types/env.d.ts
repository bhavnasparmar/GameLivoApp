declare module '@env' {
  export const ENV: string | undefined;
  export const API_BASE_URL: string | undefined;
  export const SOCKET_URL: string | undefined;
}

declare const process: {
  env?: Record<string, string | undefined>;
};

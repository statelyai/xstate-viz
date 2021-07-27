declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_SUPABASE_API_URL: string;
    REACT_APP_SUPABASE_ANON_API_KEY: string;
    REACT_APP_GRAPHQL_API_URL: string;
    REACT_APP_SENTRY_DSN: string;

    PUBLIC_URL: string;
  }
}

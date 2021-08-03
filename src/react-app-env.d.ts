declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    REACT_APP_SUPABASE_API_URL: string;
    REACT_APP_SUPABASE_ANON_API_KEY: string;
    REACT_APP_GRAPHQL_API_URL: string;

    REACT_APP_SENTRY_DSN?: string;
    REACT_APP_SENTRY_ENVIRONMENT?: string;

    PUBLIC_URL: string;
  }
}

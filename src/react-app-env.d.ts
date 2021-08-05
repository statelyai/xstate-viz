declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    NEXT_PUBLIC_SUPABASE_API_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_API_KEY: string;
    NEXT_PUBLIC_GRAPHQL_API_URL: string;

    NEXT_PUBLIC_SENTRY_DSN?: string;
    NEXT_PUBLIC_DEPLOY_ENVIRONMENT?: string;
    NEXT_PUBLIC_USE_LOCAL_MONACO?: string;

    PUBLIC_URL: string;
  }
}

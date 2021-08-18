/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />

declare module 'realms-shim' {
  class Realm {
    evaluate<T = unknown>(code: string, endowments: any): T;
  }

  const exportObj: {
    makeRootRealm(): Realm;
  };

  export default exportObj;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_API_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_API_KEY: string;
    NEXT_PUBLIC_GRAPHQL_API_URL: string;

    NEXT_PUBLIC_SENTRY_DSN?: string;
    NEXT_PUBLIC_DEPLOY_ENVIRONMENT?: string;
    NEXT_PUBLIC_USE_LOCAL_MONACO?: string;
  }
}

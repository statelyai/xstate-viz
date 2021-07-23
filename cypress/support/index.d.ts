/// <reference types="cypress" />

// Utility type copied from utility-types
type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? _DeepPartialArray<U>
  : T extends object
  ? _DeepPartialObject<T>
  : T | undefined;

interface _DeepPartialArray<T> extends Array<DeepPartial<T>> {}

type _DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> };

declare namespace Cypress {
  interface Chainable {
    /**
     * Log in to the app
     */
    login(): Chainable;

    /**
     * Allows the tester to mock the GraphQL API to return whatever
     * values they like
     */
    interceptGraphQL(
      mock: DeepPartial<
        import('../../src/graphql/schemaTypes.generated').Mutation &
          import('../../src/graphql/schemaTypes.generated').Query
      >,
    ): Chainable;
  }
}

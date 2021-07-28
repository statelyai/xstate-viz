/// <reference types="cypress" />

import '@testing-library/cypress/add-commands';
import 'cypress-localstorage-commands';
import 'cypress-real-events/support';
import { Mutation, Query } from '../../src/graphql/schemaTypes.generated';

const login = () => {
  cy.setLocalStorage(
    'supabase.auth.token',
    JSON.stringify({
      currentSession: {
        access_token: 'token',
        user: {
          app_metadata: { provider: 'github' },
          user_metadata: {
            avatar_url: 'https://avatars.githubusercontent.com/u/28293365',
            full_name: 'Matt Pocock',
          },
        },
      },
    }),
  );
};

const interceptGraphQL = (data: DeepPartial<Mutation & Query>) => {
  cy.intercept('https://stately-registry-dev.vercel.app/api/graphql', {
    body: {
      data,
    },
  });
};

type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? _DeepPartialArray<U>
  : T extends object
  ? _DeepPartialObject<T>
  : T | undefined;

interface _DeepPartialArray<T> extends Array<DeepPartial<T>> {}

type _DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> };

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Log in to the app
       */
      login: typeof login;

      /**
       * Allows the tester to mock the GraphQL API to return whatever
       * values they like
       */
      interceptGraphQL: typeof interceptGraphQL;
    }
  }
}

Cypress.Commands.add('login', login);
Cypress.Commands.add('interceptGraphQL', interceptGraphQL);

/// <reference types="cypress" />

import '@testing-library/cypress/add-commands';
import 'cypress-localstorage-commands';

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//

Cypress.Commands.add('login', () => {
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
});

Cypress.Commands.add('interceptGraphQL', (data) => {
  cy.intercept('https://stately-registry-dev.vercel.app/api/graphql', {
    body: {
      data,
    },
  });
});

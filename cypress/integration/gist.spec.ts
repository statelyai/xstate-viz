describe('Gists', () => {
  const dummyFile = `
  import { createMachine } from 'xstate';
  
  createMachine({
    id: 'gistMachine',
    initial: 'idle',
    states: {
      idle: {}
    }
  })
  `;

  beforeEach(() => {
    cy.interceptGraphQL({
      getLoggedInUser: {},
    });
    cy.login();
    cy.intercept('https://api.github.com/gists/gist-id', {
      body: {
        files: {
          'machine.js': {
            raw_url: 'https://api.github.com/gist-id.blob',
          },
        },
      },
    });
    cy.intercept('https://api.github.com/gist-id.blob', dummyFile);
    cy.visit('/?gist=gist-id');
  });

  it('Should allow you to load a source file from a gist', () => {
    cy.contains(`initial: 'idle'`);

    cy.getCanvas().contains('gistMachine');
  });

  it('Should allow you to fork a source file from a gist', () => {
    cy.interceptGraphQL({
      createSourceFile: {
        id: 'new-id',
      },
    });

    cy.getCanvas();

    cy.findByRole('button', { name: /Fork/i }).click();

    /**
     * The fork name should default to the
     * id of the machine
     */
    cy.findByLabelText(/choose a name/i).should(
      'have.value',
      'gistMachine (forked)',
    );

    cy.findByRole('button', { name: /Submit/ }).click();

    cy.contains(/New file saved successfully/);
    cy.url().should('contain', 'new-id');
  });
});

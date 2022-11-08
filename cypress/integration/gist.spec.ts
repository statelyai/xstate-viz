describe('Gists', () => {
  const dummyFile = `
  Machine({
    id: 'gistMachine',
    initial: 'idle',
    states: {
      idle: {}
    }
  })
  `;

  const setup = () => {
    cy.interceptAPI({
      getLoggedInUser: {},
    });
    cy.setMockAuthToken();
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
    cy.visit('/viz?gist=gist-id');
  };

  it('Should allow you to load a source file from a gist', () => {
    setup();
    cy.contains(`initial: 'idle'`);

    cy.getCanvas().contains('gistMachine');

    // It should automatically fix up imports
    cy.contains(`import`);
  });

  it('Should allow you to fork a source file from a gist', () => {
    setup();
    cy.interceptAPI({
      createSourceFile: {
        id: 'new-id',
      },
    });

    cy.getCanvas().contains('gistMachine');

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

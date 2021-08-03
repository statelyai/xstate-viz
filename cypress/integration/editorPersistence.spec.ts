describe('Editor persistence', () => {
  const setup = () => {
    cy.login();
    cy.interceptGraphQL({
      getLoggedInUser: {
        id: 'id',
      },
    });
  };

  describe('When you have unsaved changes', () => {
    it('Should show the changes when you re-enter the page', () => {
      setup();
      cy.visit('/');

      cy.getMonacoEditor().type(`{enter}{enter}// Code changes`);
      /**
       * There's a good reason for this specific wait!
       * We wait for the throttle of the code cache to catch up
       */
      cy.wait(500);
      cy.reload();
      cy.contains('Code changes');
    });
  });

  describe('When you have changes in localStorage that are newer than the registry', () => {
    it('Should use your localStorage changes', () => {
      cy.login();
      
      // Plant a fake entry in localStorage
      cy.setLocalStorage(
        'xstate_viz_raw_source|source-file-id',
        JSON.stringify({
          date: new Date(),
          sourceRawContent: `// Old machine`,
        }),
      );

      cy.interceptGraphQL({
        getLoggedInUser: {
          id: 'id',
        },
        getSourceFile: {
          id: 'source-file-id',
          updatedAt: '2018-04-02',
          text: `// Changes from the registry!`,
        },
      });
      cy.visit('/?id=source-file-id');

      cy.contains('// Old machine');
    });
  });

  describe('When there are unsaved changes in the registry that are more recent than your localStorage', () => {
    it('Should override localStorage', () => {
      cy.login();

      cy.setLocalStorage(
        'xstate_viz_raw_source|source-file-id',
        JSON.stringify({
          date: new Date(),
          sourceRawContent: `// Old machine`,
        }),
      );

      cy.interceptGraphQL({
        getLoggedInUser: {
          id: 'id',
        },
        getSourceFile: {
          id: 'source-file-id',
          /**
           * This test will work for the next 9 years ;)
           */
          updatedAt: '2030-04-02',
          text: `// Changes from the registry!`,
        },
      });

      cy.visit('/?id=source-file-id');

      cy.contains('Changes from the registry!');
    });
  });
});

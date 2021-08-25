const SOURCE_ID = 'c75ccdc4-418d-4ade-9059-90f0fc4ddbd1';

describe('Embedded mode', () => {
  describe('defaults', () => {
    before(() => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}`);
    });
    it('panels should be hidden', () => {
      cy.findByTestId('panels-view').should('be.hidden');
    });
    it.skip('zoom and pan buttons group should be hidden', () => {
      cy.findByTestId('controls')
        .should('be.visible')
        .within(() => {
          cy.findByRole('group').should('exist');
        });
    });
  });
});

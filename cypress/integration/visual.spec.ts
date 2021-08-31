const getCenterY = ($el: JQuery<HTMLElement>) => {
  const { y, height } = $el.get(0).getBoundingClientRect();
  return y + height / 2;
};

const isInViewport = ($el: JQuery<HTMLElement>) => {
  const { fromElViewport } = Cypress.dom.getElementPositioning($el);
  // Cypress types are broken for this at the moment
  const win = Cypress.dom.getWindowByElement($el.get(0)) as any as Window;

  return (
    fromElViewport.top >= 0 &&
    fromElViewport.right <= win.innerWidth &&
    fromElViewport.bottom <= win.innerHeight &&
    fromElViewport.left >= 0
  );
};

describe('Visual', () => {
  it('should have editor buttons in the viewport after the viewport gets downsized', () => {
    cy.visit('/viz');

    cy.getMonacoEditor();

    cy.viewport(
      Cypress.config().viewportWidth,
      Cypress.config().viewportHeight - 300,
    );

    cy.findByRole('button', { name: 'Visualize' }).then(($button) => {
      expect(isInViewport($button)).to.be.true;
    });
  });

  it('should have editor buttons aligned vertically with canvas buttons', () => {
    cy.visit('/viz');

    cy.findByRole('button', { name: 'Visualize' }).then(($visualize) => {
      cy.findByRole('button', { name: 'Zoom out' }).then(($zoomOut) => {
        expect(
          getCenterY($visualize),
          `Center y of the 'Visualize' button is the same as center y of the 'Zoom out' button`,
        ).to.eq(getCenterY($zoomOut));
      });
    });
  });

  it('show/collapsing panels button should work', () => {
    cy.visit('/viz');

    cy.findByTestId('panels').then(($panels) => {
      expect(isInViewport($panels)).eq(true);
    });

    cy.findByRole('button', { name: 'Collapse panels' }).click();

    cy.findByTestId('panels').then(($panels) => {
      expect(isInViewport($panels)).eq(false);
    });

    cy.findByRole('button', { name: 'Show panels' }).click();

    cy.findByTestId('panels').then(($panels) => {
      expect(isInViewport($panels)).eq(false);
    });

    cy.findByRole('button', { name: 'Visualize' }).then(($button) => {
      // For some odd reason, the panels are visible but not in the viewport?
      // But the "Visualize" button (in the panels) is
      expect(isInViewport($button)).eq(true);
    });
  });
});

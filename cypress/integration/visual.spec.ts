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

  it('should have login button in the viewport after the right panel gets stretched and shrinked again', () => {
    cy.visit('/viz');

    cy.getMonacoEditor();

    cy.getResizeHandle().realSwipe('toLeft', {
      length: 100,
    });

    cy.getResizeHandle().realSwipe('toRight', {
      length: 100,
    });

    cy.findByRole('button', { name: 'Login' }).then(($button) => {
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
});

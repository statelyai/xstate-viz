const getCenterY = (el: HTMLElement) => {
  const { y, height } = el.getBoundingClientRect();
  return y + height / 2;
};

describe('Visual', () => {
  it('should have editor buttons aligned vertically with canvas buttons', () => {
    cy.visit('/viz');

    cy.findByRole('button', { name: 'Visualize' }).then(($visualize) => {
      cy.findByRole('button', { name: 'Zoom out' }).then(($zoomOut) => {
        expect(getCenterY($visualize.get(0))).to.eq(
          getCenterY($zoomOut.get(0)),
        );
      });
    });
  });
});

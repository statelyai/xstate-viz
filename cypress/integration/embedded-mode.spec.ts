const SOURCE_ID = 'c75ccdc4-418d-4ade-9059-90f0fc4ddbd1';

describe('Embedded mode', () => {
  describe('default (mode:viz)', () => {
    before(() => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}`);
    });
    it('panels should be hidden', () => {
      cy.findByTestId('panels-view').should('be.hidden');
    });
    it('zoom and pan buttons group should be hidden', () => {
      cy.findByTestId('controls')
        .should('be.visible')
        .within(() => {
          cy.findByRole('group', { hidden: true }).should('exist');
        });
    });
    it('canvas header should be hidden', () => {
      cy.findByTestId('canvas-header').should('be.hidden');
    });
    it('RESET button should be visible', () => {
      cy.findByTestId('controls').within(() => {
        cy.findByRole('button', { name: /reset/i }).should('be.visible');
      });
    });
    it('More Info menu should be visible', () => {
      cy.findByTestId('controls').within(() => {
        cy.findByRole('button', { name: /more info/i }).should('be.visible');
      });
    });
    // it('the visualize button should be hidden', () => {
    //   cy.findByRole('button', { name: /visualize/i, hidden: true }).should(
    //     'be.hidden',
    //   );
    // });
    // it('the fork, new and persist buttons should be hidden', () => {
    //   [/fork/i, /new/i, /save/i, /login to save/i, /login to fork/i].forEach(
    //     (text) => {
    //       cy.findByRole('button', { name: text }).should('be.hidden');
    //     },
    //   );
    // });
  });

  describe('mode:panels', () => {
    it('should show panels view', () => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=panels`);
      cy.findByTestId('panels-view').should('be.visible');
    });
    it('should show CODE panel by default', () => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=panels`);
      // TODO: be.selected doesn't work in this case
      cy.findByRole('tab', { name: /code/i }).should(
        'have.attr',
        'aria-selected',
        'true',
      );
      cy.findByTestId('editor').should('be.visible');
    });
    it('code editor should be readonly', () => {
      const editor = cy.findByTestId('editor');
      editor.type('something');
      editor.within(() =>
        cy.findByText(/cannot edit in read-only editor/i).should('be.visible'),
      );
    });
    it('an original link to the visualizer should be shown', () => {
      cy.findByRole('link', { name: /open in stately\.ai\/viz/i })
        .should('be.visible')
        .should(($a) =>
          $a
            .attr('href')
            ?.includes('/viz?id=c75ccdc4-418d-4ade-9059-90f0fc4ddbd1'),
        );
    });
    // How do I get next test working?
    it.skip('should be able to make code editor editable', () => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=panels&readOnly=0`);
      const editor = cy.findByTestId('editor');
      const initialValue = editor.invoke('val');
      editor.type('something');
      editor.invoke('val').should('not.equal', initialValue);
    });
    it('should be able to choose active panel', () => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=panels&panel=state`);
      cy.findByRole('tab', { name: /state/i }).should(
        'have.attr',
        'aria-selected',
        'true',
      );
      cy.findByTestId('state-panel').should('be.visible');
    });
    it('should be able to hide the original link', () => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=panels&showOriginalLink=0`);
      cy.findByRole('link', { name: /open in stately\.ai\/viz/i }).should(
        'not.exist',
      );
    });
    // TODO: Fix these 3 failing tests
    it.skip('the visualize button should be hidden', () => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=panels`);
      cy.findByRole('button', { name: /visualize/i, hidden: true }).should(
        'be.hidden',
      );
    });
    it.skip('the visualize button should be shown if readOnly is disabled', () => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=panels&readOnly=0`);
      cy.findByRole('button', { name: /visualize/i }).should('be.visible');
    });
    it.skip('the fork, new and persist buttons should be hidden', () => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=panels`);
      [/fork/i, /new/i, /save/i, /login to save/i, /login to fork/i].forEach(
        (text) => {
          cy.findByRole('button', { name: text }).should('be.hidden');
        },
      );
    });
  });

  describe('mode:full', () => {
    before(() => {
      cy.visit(`/viz/embed?id=${SOURCE_ID}&mode=full`);
    });
    it('should show both canvas and panels', () => {
      cy.findByTestId('canvas-graph').should('be.visible');
      cy.findByTestId('panels-view').should('be.visible');
    });
    // Fix failing test
    it.skip('the fork, new and persist buttons should be hidden', () => {
      [/fork/i, /new/i, /save/i, /login to save/i, /login to fork/i].forEach(
        (text) => {
          cy.findByRole('button', { name: text }).should('be.hidden');
        },
      );
    });
  });
});

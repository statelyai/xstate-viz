import { GetSourceFileSsrQuery } from '../../src/graphql/GetSourceFileSSR.generated';

const SOURCE_ID = 'source-file-id';

const getSSRParam = (
  data: Partial<GetSourceFileSsrQuery['getSourceFile']> & { id: string },
) => {
  return encodeURIComponent(JSON.stringify({ data, id: data.id }));
};

describe('Embedded mode', () => {
  describe('default (mode:viz)', () => {
    before(() => {
      cy.interceptGraphQL({
        getSourceFile: {
          id: SOURCE_ID,
          text: `
import { createModel } from "xstate/lib/model";
import { createMachine } from "xstate";

createMachine({
  id: "simple",
  states: {
    a: {},
    b: {},
  },
});
          `,
        },
      });
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}`,
      );
    });
    it('panels should be hidden', () => {
      cy.getPanelsView().should('be.hidden');
    });
    it('zoom and pan buttons group should be hidden', () => {
      cy.getControlButtons()
        .should('be.visible')
        .within(() => {
          cy.findByRole('group', { hidden: true }).should('exist');
        });
    });
    it('canvas header should be hidden', () => {
      cy.getCanvasHeader().should('be.hidden');
    });
    it('RESET button should be visible', () => {
      cy.getControlButtons().within(() => {
        cy.findByRole('button', { name: /reset/i }).should('be.visible');
      });
    });
    it('More Info menu should be visible', () => {
      cy.getControlButtons().within(() => {
        cy.findByRole('button', { name: /more info/i }).should('be.visible');
      });
    });
  });

  describe('mode:panels', () => {
    beforeEach(() => {
      cy.interceptGraphQL({
        getSourceFile: {
          id: SOURCE_ID,
          text: `
import { createModel } from "xstate/lib/model";
import { createMachine } from "xstate";

createMachine({
  id: "simple",
  states: {
    a: {},
    b: {},
  },
});
          `,
        },
      });
    });
    it('should show panels view', () => {
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=panels`,
      );
      cy.getPanelsView().should('be.visible');
    });
    it('should show CODE panel by default', () => {
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=panels`,
      );
      cy.findByRole('tab', { name: /code/i }).should(
        'have.attr',
        'aria-selected',
        'true',
      );
      cy.getMonacoEditor().should('be.visible');
    });
    it('code editor should be readonly', () => {
      const editor = cy.getMonacoEditor();
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
            ?.includes('/viz/c75ccdc4-418d-4ade-9059-90f0fc4ddbd1'),
        );
    });
    it('should be able to make code editor editable', () => {
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=panels&readOnly=0`,
      );
      const editor = cy.getMonacoEditor();
      editor.type('something');
      editor.contains('something');
    });
    it('should be able to choose active panel', () => {
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=panels&panel=state`,
      );
      cy.findByRole('tab', { name: /state/i }).should(
        'have.attr',
        'aria-selected',
        'true',
      );
      cy.getStatePanel().should('be.visible');
    });
    it('should be able to hide the original link', () => {
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=panels&showOriginalLink=0`,
      );
      cy.findByRole('link', { name: /open in stately\.ai\/viz/i }).should(
        'not.exist',
      );
    });
    it('the visualize button should be hidden', () => {
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=panels`,
      );
      cy.contains('button', /visualize/i).should('not.be.visible');
    });
    it('the visualize button should be shown if readOnly is disabled', () => {
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=panels&readOnly=0`,
      );
      cy.findByRole('button', { name: /visualize/i }).should('be.visible');
    });
    it('the "New" and "Login to fork" should be hidden', () => {
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=panels`,
      );
      [/new/i, /login to fork/i].forEach((text) => {
        cy.contains('button', text).should('be.hidden');
      });
    });
  });

  describe('mode:full', () => {
    before(() => {
      cy.interceptGraphQL({
        getSourceFile: {
          id: SOURCE_ID,
          text: `
  import { createModel } from "xstate/lib/model";
  import { createMachine } from "xstate";
  
  createMachine({
    id: "simple",
    states: {
      a: {},
      b: {},
    },
  });
            `,
        },
      });
      cy.visit(
        `/viz/embed/${SOURCE_ID}?ssr=${getSSRParam({
          id: SOURCE_ID,
        })}&mode=full`,
      );
    });
    it('should show both canvas and panels', () => {
      cy.getCanvasGraph().should('be.visible');
      cy.getPanelsView().should('be.visible');
    });
  });
});

const sourceFileFixture = {
  id: 'source-file-id',
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
};

describe('Embedded mode', () => {
  describe('default (mode:viz)', () => {
    before(() => {
      cy.interceptGraphQL({
        getSourceFile: sourceFileFixture,
      });
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
      });
    });
    it('panels should be hidden', () => {
      cy.getPanelsView().should('be.hidden');
    });
    it('zoom and pan buttons group should be hidden', () => {
      cy.getControlButtons().should('not.exist');
    });
    it('canvas header should be hidden', () => {
      cy.getCanvasHeader().should('not.exist');
    });
  });

  describe('mode:panels', () => {
    beforeEach(() => {
      cy.interceptGraphQL({
        getSourceFile: sourceFileFixture,
      });
    });
    it('should show panels view', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'panels',
      });
      cy.getPanelsView().should('be.visible');
    });
    it('should show CODE panel by default', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'panels',
      });
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
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'panels',
        readOnly: false,
      });
      const editor = cy.getMonacoEditor();
      editor.type('something');
      editor.contains('something');
    });
    it('should be able to choose active panel', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'panels',
        panel: 'state',
      });
      cy.findByRole('tab', { name: /state/i }).should(
        'have.attr',
        'aria-selected',
        'true',
      );
      cy.getStatePanel().should('be.visible');
    });
    it('should be able to hide the original link', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'panels',
        showOriginalLink: false,
      });
      cy.findByRole('link', { name: /open in stately\.ai\/viz/i }).should(
        'not.exist',
      );
    });
    it('the visualize button should be hidden', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'panels',
      });
      cy.contains('button', /visualize/i).should('not.exist');
    });
    it('the visualize button should be shown if readOnly is disabled', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'panels',
        readOnly: false,
      });
      cy.findByRole('button', { name: /visualize/i }).should('be.visible');
    });
    it('the "New" and "Login to fork" should be hidden', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'panels',
      });
      [/new/i, /login to fork/i].forEach((text) => {
        cy.contains('button', text).should('not.exist');
      });
    });
  });

  describe('mode:full', () => {
    before(() => {
      cy.interceptGraphQL({
        getSourceFile: sourceFileFixture,
      });
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: 'full',
      });
    });
    it('should show both canvas and panels', () => {
      cy.getCanvasGraph().should('be.visible');
      cy.getPanelsView().should('be.visible');
    });
  });
});

import { EmbedMode, EmbedPanel } from '../../src/types';

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
  describe('default controls', () => {
    before(() => {
      cy.interceptAPI({
        getSourceFile: sourceFileFixture,
      });
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        controls: true,
      });
    });

    it('RESET and fit_to_content button should be visible regardless of the mode only if constols is enabled', () => {
      cy.getResetButton().should('be.visible');
      cy.getFitToContentButton().should('be.visible');
    });
  });
  describe('default (mode:viz)1', () => {
    before(() => {
      cy.interceptAPI({
        getSourceFile: sourceFileFixture,
      });
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
      });
    });
    it('panels should be hidden', () => {
      cy.getPanelsView().should('be.hidden');
    });
    it('canvas header should be hidden', () => {
      cy.getCanvasHeader().should('not.exist');
    });
  });

  describe('mode:panels', () => {
    beforeEach(() => {
      cy.interceptAPI({
        getSourceFile: sourceFileFixture,
      });
    });
    it('should show panels view', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: EmbedMode.Panels,
      });
      cy.getPanelsView().should('be.visible');
    });
    it('should show CODE panel by default', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: EmbedMode.Panels,
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
        mode: EmbedMode.Panels,
        readOnly: false,
      });
      const editor = cy.getMonacoEditor();
      editor.type('something');
      editor.contains('something');
    });
    it('should be able to choose active panel', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: EmbedMode.Panels,
        panel: EmbedPanel.State,
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
        mode: EmbedMode.Panels,
        showOriginalLink: false,
      });
      cy.findByRole('link', { name: /open in stately\.ai\/viz/i }).should(
        'not.exist',
      );
    });
    it('the visualize button should be hidden', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: EmbedMode.Panels,
      });
      cy.contains('button', /visualize/i).should('not.exist');
    });
    it('the visualize button should be shown if readOnly is disabled', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: EmbedMode.Panels,
        readOnly: false,
      });
      cy.findByRole('button', { name: /visualize/i }).should('be.visible');
    });
    it('the "New" and "Login to fork" should be hidden', () => {
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: EmbedMode.Panels,
      });
      [/new/i, /login to fork/i].forEach((text) => {
        cy.contains('button', text).should('not.exist');
      });
    });
  });

  describe('mode:full', () => {
    before(() => {
      cy.interceptAPI({
        getSourceFile: sourceFileFixture,
      });
      cy.visitEmbedWithNextPageProps({
        sourceFile: sourceFileFixture,
        mode: EmbedMode.Full,
      });
    });
    it('should show both canvas and panels', () => {
      cy.getCanvasGraph().should('be.visible');
      cy.getPanelsView().should('be.visible');
    });
  });
});

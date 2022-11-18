import { SourceFile } from '../../src/apiTypes';

const SOURCE_ID = 'source-file-id';

const getSSRParam = (data: Partial<SourceFile> & { id: string }) => {
  return encodeURIComponent(JSON.stringify({ data, id: data.id }));
};

describe('Embed Preview', () => {
  beforeEach(() => {
    cy.interceptAPI({
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
      `/viz/${SOURCE_ID}?ssr=${getSSRParam({
        id: SOURCE_ID,
      })}`,
    );
  });

  it('Shows Embed button under share menu', () => {
    cy.findByRole('button', { name: /share/i }).click();
    cy.findByRole('menuitem', { name: /embed/i }).should('be.visible');
  });

  it('Opens the Embed preview when clicking on the Embed button', () => {
    cy.findByRole('button', { name: /share/i }).click();
    cy.findByRole('menuitem', { name: /embed/i }).click();
    cy.getEmbedPreview().should('be.visible');
  });
});

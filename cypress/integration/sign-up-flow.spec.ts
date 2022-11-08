describe('Sign up funnel', () => {
  describe('When you are logged out', () => {
    it('Should ask you to sign up when you save', () => {
      cy.visit('/viz');
      cy.findByRole('button', {
        name: /save/i,
      }).click();

      cy.findByText(/Sign in to Stately/i);
    });

    describe(`When you are viewing someone else's machine`, () => {
      it('Should ask you to sign up when you fork it', () => {
        cy.interceptAPI({
          getSourceFile: {
            id: 'source-file-id',
            text: '// Some great text',
          },
        });

        cy.visitVizWithNextPageProps({ id: 'source-file-id' });

        cy.findByRole('button', {
          name: /fork/i,
        }).click();

        cy.findByText(/Sign in to Stately/i);
      });

      it('Should ask you to sign up when you press like', () => {
        cy.interceptAPI({
          getSourceFile: {
            id: 'source-file-id',
            text: `
              import { createMachine } from 'xstate';

              const machine = createMachine({});
            `,
            likesCount: 200,
            youHaveLiked: false,
            name: 'Source File',
            owner: {
              id: 'id',
              displayName: 'David Khourshid',
            },
          },
        });

        cy.visitVizWithNextPageProps({ id: 'source-file-id' });

        // Need to wait for the canvas to load
        cy.getCanvas();

        cy.contains(/200/).click();

        cy.findByText(/Sign in to Stately/i);
      });
    });
  });
});

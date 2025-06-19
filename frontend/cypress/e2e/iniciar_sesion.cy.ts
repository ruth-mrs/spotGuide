describe('Inicio de sesión', () => {
  it('permite iniciar sesión correctamente', () => {
    cy.visit('http://localhost:4200/spotGuide/');
    cy.contains('Iniciar sesión').click();
    cy.get('.login-container', { timeout: 10000 }).should('be.visible');
    cy.wait(1000);

    // Usa un usuario que exista en la base de datos
    cy.get('app-custom-input[name="email"]').find('input').type('a@a.com', { force: true });
    cy.get('app-custom-input[name="password"]').find('input').type('AAaa00..', { force: true });

    cy.get('ion-button[type="submit"]').click();
    cy.url().should('include', '/pois');
  });
});
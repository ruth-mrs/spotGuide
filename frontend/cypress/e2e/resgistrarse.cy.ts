describe('Registro de usuario', () => {
  it('permite registrar un usuario correctamente', () => {
    cy.visit('http://localhost:4200/spotGuide/');
    cy.contains('Registrarse').click();
    cy.get('.register-container', { timeout: 10000 }).should('be.visible');
    cy.wait(1000);

    cy.get('app-custom-input[name="username"]').find('input').type('test' + Date.now(), { force: true });
    cy.get('app-custom-input[name="name"]').find('input').type('Test User', { force: true });
    cy.get('app-custom-input[name="email"]').find('input').type(`test${Date.now()}@test.com`, { force: true });
    cy.get('app-custom-input[name="password"]').find('input').type('Password123', { force: true });
    cy.get('app-custom-input[name="confirmPassword"]').find('input').type('Password123', { force: true });

    cy.get('ion-button[type="submit"]').click();
    cy.url().should('include', '/pois');
  });
});
describe('Añadir POI', () => {
  it('permite añadir un POI personalizado correctamente', () => {
    cy.visit('http://localhost:4200/spotGuide/');
    cy.contains('Iniciar sesión').click();
    cy.get('.login-container', { timeout: 10000 }).should('be.visible');
    cy.wait(1000);

    // Login con usuario existente
    cy.get('app-custom-input[name="email"]').find('input').type('a@a.com', { force: true });
    cy.get('app-custom-input[name="password"]').find('input').type('AAaa00..', { force: true });
    cy.get('ion-button[type="submit"]').click();
    cy.url().should('include', '/pois');

    // Ir a la pantalla de añadir POI
    cy.get('.tabs-inner > ion-router-outlet > .ion-page > .poi-list-bg > .content-section > .add-points-section > app-custom-button > .btn-accent').click({ force: true });

    // Completar nombre
    cy.get('ion-input[placeholder="Ej: Mi lugar favorito"] input').type('POI Cypress', { force: true });

    // Completar descripción
    cy.get('ion-textarea[placeholder="Describe qué hace especial este lugar..."] textarea').type('Un lugar de prueba añadido por Cypress.', { force: true });

    // Seleccionar categoría (elige la primera opción disponible)
    cy.get('ion-select[placeholder="Selecciona una categoría"]').click();
    cy.get('ion-select-option').first().click();

    // Añadir imagen por URL
    cy.get('.tabs-inner > ion-router-outlet > .ion-page > .poi-list-bg > .content-section > .add-points-section > app-custom-button > .btn-accent').click();
    cy.get('ion-item input[type="url"]').type('https://placekitten.com/400/300', { force: true });

    // Seleccionar ubicación en el mapa (simula click en el mapa)
    cy.get('app-map .leaflet-container').click(150, 150);

    // Guardar POI
    cy.get('ion-button.save-btn').click();

    // Verifica que aparece el toast de éxito o vuelve a la lista de POIs
    cy.contains('¡POI guardado!').should('be.visible');
    cy.url().should('include', '/pois');
  });
});
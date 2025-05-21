// Float Menu Functionality

/**
 * FloatMenuManager handles the floating action button and menu
 */
class FloatMenuManager {
  /**
   * Initialize the float menu manager
   */
  constructor() {
    this.floatMenuToggle = document.getElementById('float-menu-toggle');
    this.floatMenuContainer = document.querySelector('.float-menu-container');
    this.menuButtons = document.querySelectorAll('.float-menu-button');

    this.initEventListeners();
    Utils.log('Float menu manager initialized');
  }

  /**
   * Initialize event listeners for float menu
   */
  initEventListeners() {
    if (!this.floatMenuToggle || !this.floatMenuContainer) {
      Utils.log('Missing float menu elements');
      return;
    }

    // Toggle menu on click
    Utils.addClickEvent(this.floatMenuToggle, this.toggleMenu.bind(this));

    // Add ripple effect to menu buttons
    this.menuButtons.forEach(button => {
      button.addEventListener('click', Utils.createRippleEffect);
      button.addEventListener('touchstart', Utils.createRippleEffect, { passive: true });

      // Close menu when a button is clicked
      button.addEventListener('click', () => {
        // Small delay to show the ripple effect
        // setTimeout(() => {
        //   this.floatMenuContainer.classList.remove('active');
        //   this.floatMenuToggle.classList.remove('active');
        // }, 200);
      });
    });

    // Prevent the default touchstart behavior to avoid double triggering
    this.floatMenuToggle.addEventListener('touchstart', (e) => {
      e.preventDefault();
    });


    document.addEventListener('click', (e) => {
      if (this.floatMenuContainer.classList.contains('active') &&
        !this.floatMenuContainer.contains(e.target)) {
        this.floatMenuContainer.classList.remove('active');
        this.floatMenuToggle.classList.remove('active');
      }
    });
  }

  /**
   * Toggle the float menu
   */
  toggleMenu() {
    this.floatMenuContainer.classList.toggle('active');
    this.floatMenuToggle.classList.toggle('active');

    Utils.log('Float menu toggled',
      this.floatMenuContainer.classList.contains('active') ? 'open' : 'closed');
  }
}

// Create an instance when the DOM is loaded

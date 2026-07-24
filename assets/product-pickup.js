class ProductPickup extends HTMLElement {
  constructor() {
    super();

    this.init = this.dataset.loadFirstVariant === 'true';
    this.product_title = this.dataset.title;
    this.pickup_drawer_container = document.querySelector(
      '.off-canvas--container[data-view="pickup"]'
    );
    this.root = this.closest(`[data-product-id='${this.dataset.id}']`);

    this.load();
  }

  load() {
    this.initPickup();
    this.updatePickupListener();

    // in case theme.js loads first, we need access to the theme object
    window.addEventListener('theme:loaded', () => this.initPickup());
  }

  initPickup() {
    if (this.init) {
      this.getPickupForm(this.dataset.firstVariantId);
    } else {
      this.parentNode.dataset.empty = true;
    }
  }

  updatePickupListener() {
    this.root.addEventListener('variantUpdated', event => {
      const variant = event.detail;

      if (variant && variant.available && variant.inventory_management === 'shopify') {
        this.getPickupForm(variant.id);
      } else if (variant.inventory_management !== 'shopify' || !variant.available) {
        this.removeOldForm();
      }
    });
  }

  getPickupForm(variant_id) {
    this.setAttribute('data-loading', true);

    const request = new XMLHttpRequest();
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        this.setAttribute('data-loading', false);
        this.removeOldForm();

        const new_form = theme.utils.parseHtml(request.response, '.pickup--form--container', true);

        if (new_form) {
          this.appendChild(new_form);
          this.parentNode.dataset.empty = false;

          const new_drawer = theme.utils.parseHtml(
            request.response,
            '.pickup--drawer--container',
            true
          );

          new_drawer.querySelector('.pickup--drawer--product-title').innerText = this.product_title;
          if (this.dataset.isOnlyVariant === 'true') {
            new_drawer.querySelector('.pickup--drawer--variant-title').style.display = 'none';
          }

          this.pickup_drawer_container.appendChild(new_drawer);

          // reinit off-canvas so that open/close triggers work
          theme.partials.OffCanvas.unload();
          theme.partials.OffCanvas.load();
        }
      }
    };

    request.onerror = () => console.log(`${request.statusText}: product pickup request failed!`);
    request.open('GET', `${theme.urls.root}/variants/${variant_id}/?section_id=pickup`);
    request.send();
  }

  removeOldForm() {
    this.parentNode.dataset.empty = true;
    this.pickup_drawer_container.innerHTML = '';
    this.innerHTML = '';
  }
}

customElements.define('product-pickup-root', ProductPickup);

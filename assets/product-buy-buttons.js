class ProductBuyButtons extends HTMLElement {
  constructor() {
    super();

    this.button_container = this.querySelector('.product-buy-buttons--primary');
    this.button_text = this.querySelector('.product-buy-buttons--cta-text');
    this.form = this.querySelector('.product-buy-buttons--form');
    this.root = this.closest(`[data-product-id='${this.dataset.id}']`);
    this.select_input = this.querySelector('.product-buy-buttons--select');
    this.smart_button = this.querySelector('.product-buy-buttons--smart');
    this.primary_button = this.querySelector('.product-buy-buttons--cta');

    this.load();
  }

  load() {
    this.addToCartListener();
    this.updateViewListener();
  }

  addToCartListener() {
    this.form.addEventListener('submit', event => {
      const form = event.target;
      const quantity_available = theme.classes.Product.getAvailableQuantity(form);

      if (theme.settings.cart_type === 'drawer' || quantity_available == false) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (quantity_available) this.button_container.setAttribute('data-loading', 'true');

      if (theme.settings.cart_type === 'drawer' && quantity_available) {
        theme.partials.Cart.addItem(form, success => {
          if (success) {
            theme.partials.Cart.updateAllHtml(() => this.addProductComplete());
          } else {
            this.button_container.setAttribute('data-loading', false);
          }
        });
      }
    });
  }

  addProductComplete() {
    this.button_container.setAttribute('data-loading', false);
    // const off_canvas = theme.partials.OffCanvas;
    theme.partials.OffCanvas.right_sidebar.attr('data-active', 'cart');

    if (theme.partials.OffCanvas.state === 'closed') {
      theme.partials.OffCanvas.right_sidebar_view = 'cart';
      theme.partials.OffCanvas.openRight();
      theme.partials.OffCanvas.last_trigger = this.primary_button;
    }
  }

  updateViewListener() {
    this.root.addEventListener('variantUpdated', event => {
      let variant = event.detail;
      const selected_option = this.select_input.querySelector('option[selected]');
      if (selected_option) selected_option.removeAttribute('selected');

      if (variant && variant.available) {
        this.selectVariant(variant.id);
        this.updateView(true, true);
      } else if (variant && !variant.available) {
        this.selectVariant(variant.id);
        this.updateView(false, true);
      } else {
        this.updateView(false, false);
      }
    });
  }

  selectVariant(variant_id) {
    const selected_option = this.select_input.querySelector(`option[value='${variant_id}']`);
    selected_option.setAttribute('selected', true);
  }

  updateView(enable, available) {
    if (enable) {
      this.primary_button.removeAttribute('disabled');
      this.button_text.innerText = theme.translations.add_to_cart;
      this.smart_button.style.display = 'block';
    } else {
      this.primary_button.setAttribute('disabled', true);
      this.smart_button.style.display = 'none';

      if (available) {
        this.button_text.innerText = theme.translations.out_of_stock;
      } else {
        this.button_text.innerText = theme.translations.unavailable;
      }
    }
  }
}

customElements.define('product-buy-buttons-root', ProductBuyButtons);

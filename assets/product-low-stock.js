class ProductLowStock extends HTMLElement {
  constructor() {
    super();

    this.initial_availability = this.dataset.initialAvailability === 'true';
    this.initial_quantity = parseInt(this.dataset.initialQuantity);
    this.root = this.closest(`[data-product-id='${this.dataset.id}']`);
    this.threshold = parseInt(this.dataset.threshold);
    this.variants_json = JSON.parse(this.querySelector('.product-low-stock--json').value);

    this.load();
  }

  load() {
    this.updateListener();

    if (this.initial_availability) {
      this.update(this.initial_quantity);
    } else {
      this.hide();
    }
  }

  updateListener() {
    this.root.addEventListener('variantUpdated', event => {
      // have to use a custom object to get the quantity property
      const variant = this.variants_json.find(variant => variant.id === event.detail.id);

      if (variant && variant.available) {
        this.update(variant.quantity);
      } else {
        this.hide();
      }
    });
  }

  update(quantity) {
    let message;

    if (!quantity || quantity < 1 || quantity > this.threshold) {
      this.hide();
      return;
    } else if (quantity === 1) {
      message = theme.translations.low_in_stock.one;
      //  for non-english languages
      message = message.replace('&#39;', "'");
    } else if (quantity > 1) {
      message = theme.translations.low_in_stock.other;
      message = message.replace(/\d+/, quantity).replace('&#39;', "'");
    }

    this.innerText = message;
    this.show();
  }

  hide() {
    this.style.display = 'none';
    this.parentNode.setAttribute('data-empty', true);
  }

  show() {
    this.style.display = 'block';
    this.parentNode.setAttribute('data-empty', false);
  }
}

customElements.define('product-low-stock-root', ProductLowStock);

class ProductPrice extends HTMLElement {
  constructor() {
    super();

    this.compare_price = this.querySelector('.product-price--compare');
    this.price = this.querySelector('.product-price--original');
    this.reference_unit = this.querySelector('.product-price--reference-unit');
    this.reference_value = this.querySelector('.product-price--reference-value');
    this.root = this.closest(`[data-product-id='${this.dataset.id}']`);
    this.unit_price = this.querySelector('.product-price--unit-price');
    this.unit_price_container = this.querySelector('.product-price--unit-container');

    this.load();
  }

  load() {
    this.updatePriceListener();
  }

  updatePriceListener() {
    this.root.addEventListener('variantUpdated', event => {
      this.updatePrices(event.detail);
    });
  }

  updatePrices(variant) {
    if (variant) {
      this.style.display = 'block';
    } else {
      this.style.display = 'none';
      return;
    }

    this.price.innerHTML = theme.utils.formatMoney(variant.price);

    if (variant.compare_at_price > variant.price) {
      this.compare_price.innerHTML = theme.utils.formatMoney(variant.compare_at_price);
      this.compare_price.style.display = 'inline-block';
    } else {
      this.compare_price.style.display = 'none';
    }

    if (variant.unit_price_measurement) {
      this.unit_price.innerHTML = theme.utils.formatMoney(variant.unit_price);
      this.reference_unit.innerHTML = variant.unit_price_measurement.reference_unit;

      if (variant.unit_price_measurement.reference_value == 1 && this.reference_value) {
        this.reference_value.style.display = 'none';
      } else if (this.reference_value) {
        this.reference_value.innerHTML = variant.unit_price_measurement.reference_value;
        this.reference_value.style.display = 'block';
      }

      this.unit_price_container.style.display = 'flex';
    } else {
      this.unit_price_container.style.display = 'none';
    }
  }
}

customElements.define('product-price-root', ProductPrice);

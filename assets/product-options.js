class ProductOptions extends HTMLElement {
  constructor() {
    super();

    this.first_variant_available = this.dataset.firstVariantAvailable === 'true';
    this.is_product_page = this.closest('.product-page--root') !== null;
    this.labels = this.querySelectorAll('.disclosure--root, .radios--header');
    this.options_container = this.querySelector('.product-options--container');
    this.option_inputs = this.options_container.querySelectorAll(
      '[data-item="disclosure"], [data-item="radio"]'
    );
    this.root = this.closest(`[data-product-id='${this.dataset.id}']`);
    this.size_chart = this.querySelector('.product-options--option .product-size-chart--root');
    this.variants = JSON.parse(this.querySelector('.product-options--json').value);

    this.load();
  }

  load() {
    this.getAvailableVariants();
    this.disableEmptyOptions();
    this.optionChangeListener();
    this.updateDisabledOptions(this.first_variant_available);

    if (this.size_chart) this.moveSizeChart();
  }

  getAvailableVariants() {
    this.available_variants = [];
    this.variants.forEach(variant => {
      if (variant.available) {
        this.available_variants.push(variant.options);
      }
    });
  }

  disableEmptyOptions() {
    //  flatten array
    const available_options = [].concat.apply([], this.available_variants);

    const options = this.options_container.querySelectorAll(
      '.radios--input, .disclosure--option-link'
    );

    if (!options.length) return;

    options.forEach(option => {
      const current_value = this.getOptionValue(option);

      if (!available_options.includes(current_value)) {
        option.setAttribute('data-empty', true);
      }
    });
  }

  getOptionValue(option) {
    if (option.getAttribute('data-value')) {
      return option.getAttribute('data-value');
    } else {
      return option.value;
    }
  }

  optionChangeListener() {
    this.option_inputs.forEach(input => {
      input.addEventListener('change', event => {
        const selected_options = [];
        const current_options = this.options_container.querySelectorAll(
          '[data-item="disclosure"], [data-item="radio"]:checked'
        );

        current_options.forEach(current_option => {
          const index = current_option.closest('.product-options--option').dataset.index;

          selected_options.push({
            index: index,
            value: current_option.value
          });
        });

        let variant_found = false;
        this.variants.every(variant => {
          let options_match = true;

          selected_options.forEach(option => {
            if (options_match) options_match = variant.options[option.index] === option.value;
          });

          if (options_match) {
            variant_found = variant;
            return false;
          }

          return true;
        });

        this.updateVariant(variant_found, event.target);
      });
    });
  }

  updateVariant(variant, selected_option) {
    this.updateDisabledOptions(variant.available, selected_option);

    if (this.is_product_page) this.updateHistoryState(variant.id);

    // external modules & apps can link in here and access new variant object via event.detail.variant
    const variant_update_event = new CustomEvent('variantUpdated', { detail: variant });
    this.root.dispatchEvent(variant_update_event);
  }

  updateHistoryState(variant_id) {
    let new_variant_url = `${location.origin}${location.pathname}`;

    if (variant_id) new_variant_url += `?variant=${variant_id}`;

    history.replaceState({ path: new_variant_url }, '', new_variant_url);
  }

  updateDisabledOptions(variant_available, selected_option = false) {
    const options = this.options_container.querySelectorAll(
      '.radios--input, .disclosure--option-link'
    );
    if (!options.length) return;

    const selected_options = [];
    options.forEach(option => {
      option.removeAttribute('data-unavailable');
      if (option.checked || option.getAttribute('aria-current') === 'true') {
        selected_options.push(option);
      }
    });

    const disclosure_toggles = this.options_container.querySelectorAll(
      '.disclosure--current-option'
    );

    let selected_value;
    if (selected_option === false) {
      selected_option = selected_options[0];
      selected_value = this.getOptionValue(selected_option);
    } else if (selected_option.classList.contains('disclosure--input')) {
      selected_value = selected_option.value;
      selected_option = selected_options.find(
        option => option.getAttribute('data-value') === selected_value
      );
    } else {
      selected_value = selected_option.value;
    }

    const options_in_same_container = [];
    const option_container = selected_option.closest('.radios--container, .disclosure--form');
    const option_input = option_container.querySelectorAll(
      '.radios--input, .disclosure--option-link'
    );

    option_input.forEach(option => {
      const current_value = this.getOptionValue(option);

      if (current_value !== selected_value) options_in_same_container.push(current_value);
    });

    const options_available_with_current_selection = options_in_same_container;
    this.available_variants.forEach(available_variant => {
      if (available_variant.includes(selected_value)) {
        available_variant.forEach(option => options_available_with_current_selection.push(option));
      }
    });

    options.forEach(option => {
      const current_value = this.getOptionValue(option);

      if (!options_available_with_current_selection.includes(current_value)) {
        option.setAttribute('data-unavailable', true);
      }
    });

    if (!variant_available) {
      selected_options.forEach(option => option.setAttribute('data-unavailable', true));
      if (disclosure_toggles) {
        disclosure_toggles.forEach(toggle => toggle.setAttribute('data-unavailable', true));
      }
    } else if (disclosure_toggles) {
      disclosure_toggles.forEach(toggle => toggle.setAttribute('data-unavailable', false));
    }
  }

  moveSizeChart() {
    const option_header = this.size_chart.parentNode.querySelector('label').parentNode;
    option_header.appendChild(this.size_chart);
  }
}

customElements.define('product-options-root', ProductOptions);

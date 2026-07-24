class CollapsibleTab extends HTMLElement {
  constructor() {
    super();

    this.current_width = window.innerWidth;
    this.description = this.querySelector('.collapsible-tab--content');
    this.description_wrapper = this.querySelector('.collapsible-tab--content-wrapper');
    this.toggle = this.querySelector('.collapsible-tab--toggle');

    this.load();
  }

  load() {
    ['click', 'keydown'].forEach(event_type => {
      this.toggleListener(event_type);
    });

    this.transitionListener();
    this.resizeListener();
  }

  toggleListener(event_type) {
    this.toggle.addEventListener(event_type, event => {
      if (event.type === 'keydown' && event.key !== 'Enter') return;

      const aria_expanded = this.toggle.getAttribute('aria-expanded') == 'true';
      this.setTransitions(!aria_expanded);
    });
  }

  setTransitions(expand) {
    this.toggle.setAttribute('aria-expanded', expand);

    if (expand) {
      this.description_wrapper.style.height = `${this.description.offsetHeight}px`;
      this.description_wrapper.setAttribute('data-transition', 'forwards');
    } else {
      this.description_wrapper.style.height = '0px';
      this.description.setAttribute('data-transition', 'fade-out');
    }
  }

  resizeListener() {
    window.addEventListener('resize', () => {
      if (this.current_width !== window.innerWidth) {
        this.setTransitions(false);
        this.current_width = window.innerWidth;
      }
    });
  }

  transitionListener() {
    this.description_wrapper.addEventListener('transition:at_end', () => {
      this.description.setAttribute('data-transition', 'fade-in');
    });
  }
}

customElements.define('collapsible-tab-root', CollapsibleTab);

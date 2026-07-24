class PasswordPage extends HTMLElement {
  constructor() {
    super();

    this.login_form = this.querySelector('.password--login-form');
    this.login_cancel = this.querySelector('.password--cancel');
    this.login_link = this.querySelector('.password--login-link');
    this.signup_form = this.querySelectorAll('.password--main > *');

    this.load();
  }

  load() {
    ['click', 'keydown'].forEach(event_type => {
      this.loginFormListener(event_type);
      this.cancelLoginListener(event_type);
    });
  }

  loginFormListener(event_type) {
    this.login_link.addEventListener(event_type, event => {
      event.preventDefault();
      if (event.type === 'keydown' && event.key !== 'Enter') {
        return;
      }

      this.login_link.style['visibility'] = 'hidden';
      this.signup_form.forEach(el => (el.style['display'] = 'none'));
      this.login_form.style['visibility'] = 'visible';
      this.login_form.querySelector('input[type="password"]').focus();
    });
  }

  cancelLoginListener(event_type) {
    this.login_cancel.addEventListener(event_type, event => {
      if (event.type === 'keydown' && event.key !== 'Enter') return;

      this.signup_form.forEach(el => (el.style['display'] = 'block'));
      this.login_form.style['visibility'] = 'hidden';
      this.login_link.style['visibility'] = 'visible';
    });
  }
}

customElements.define('password-root', PasswordPage);

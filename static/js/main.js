(function () {
  'use strict';

  // ── Mobile nav toggle ────────────────────────────────────────────────────
  const navToggle = document.querySelector('.nav-toggle');
  const navWrapper = document.querySelector('.nav-wrapper');

  if (navToggle && navWrapper) {
    navToggle.addEventListener('click', function () {
      const isOpen = navWrapper.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ── Desktop dropdown toggles ─────────────────────────────────────────────
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  dropdownToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      const parent = toggle.closest('.has-dropdown');
      document.querySelectorAll('.has-dropdown.is-open').forEach(function (el) {
        if (el !== parent) {
          el.classList.remove('is-open');
          el.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
        }
      });
      const isOpen = parent.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-dropdown')) {
      document.querySelectorAll('.has-dropdown.is-open').forEach(function (el) {
        el.classList.remove('is-open');
        el.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Close mobile nav on resize to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1000 && navWrapper) {
      navWrapper.classList.remove('is-open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ── Contact form ─────────────────────────────────────────────────────────
  const contactForm = document.getElementById('contact-form');
  const formStatus  = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      formStatus.textContent = 'Sending…';

      const data = {
        source:  contactForm.dataset.source || 'Contact Form',
        name:    contactForm.elements['name'].value,
        email:   contactForm.elements['email'].value,
        message: contactForm.elements['message'].value,
      };

      try {
        const res = await fetch('/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        });
        if (res.ok) {
          formStatus.textContent = 'Thank you! We will be in touch soon.';
          contactForm.reset();
        } else {
          throw new Error('Server error');
        }
      } catch {
        formStatus.textContent = 'Something went wrong. Please email us directly at info@sftriclub.org';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
})();

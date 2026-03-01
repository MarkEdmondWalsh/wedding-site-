// ===== Envelope Opening =====
const envelopeScreen = document.getElementById('envelope-screen');
const envelopeContainer = document.getElementById('envelope-container');
const envelope = document.getElementById('envelope');
const inviteOverlay = document.getElementById('invite-overlay');
const mainSite = document.getElementById('main-site');

function enterSite() {
  envelopeScreen.classList.add('hidden');
  inviteOverlay.classList.remove('active');
  inviteOverlay.style.display = 'none';
  mainSite.classList.add('visible');
  document.body.style.overflow = '';
  localStorage.setItem('seen-intro', '1');
  updateCountdown();
  setInterval(updateCountdown, 1000);
  initFadeObserver();
}

// Skip intro for returning visitors
if (localStorage.getItem('seen-intro')) {
  envelopeScreen.classList.add('hidden');
  inviteOverlay.style.display = 'none';
  mainSite.classList.add('visible');
  updateCountdown();
  setInterval(updateCountdown, 1000);
  initFadeObserver();
} else {
  document.body.style.overflow = 'hidden';
}

envelopeContainer.addEventListener('click', () => {
  envelope.classList.add('opened');
  setTimeout(() => {
    envelopeScreen.classList.add('hidden');
    inviteOverlay.classList.add('active');
  }, 1000);
});

// ===== Invite Carousel =====
const pages = [
  document.getElementById('invite-page-1'),
  document.getElementById('invite-page-2'),
  document.getElementById('invite-page-3'),
];
const dots = document.querySelectorAll('.dot');
let currentPage = 0;

function showPage(index) {
  pages.forEach((p, i) => {
    p.classList.toggle('active', i === index);
  });
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === index);
  });
  currentPage = index;
}

document.getElementById('invite-next-1').addEventListener('click', () => showPage(1));
document.getElementById('invite-next-2').addEventListener('click', () => showPage(2));
document.getElementById('invite-enter').addEventListener('click', enterSite);

// ===== Countdown Timer =====
const WEDDING_DATE = new Date('2026-06-26T13:30:00+01:00');

function updateCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  const now = new Date();
  const diff = WEDDING_DATE - now;

  if (diff <= 0) {
    el.innerHTML = '<p style="font-size:1.2rem; letter-spacing:2px;">Today is the day!</p>';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  el.innerHTML = `
    <div class="countdown-unit">
      <span class="countdown-number">${days}</span>
      <span class="countdown-label">Days</span>
    </div>
    <div class="countdown-unit">
      <span class="countdown-number">${hours}</span>
      <span class="countdown-label">Hours</span>
    </div>
    <div class="countdown-unit">
      <span class="countdown-number">${minutes}</span>
      <span class="countdown-label">Min</span>
    </div>
    <div class="countdown-unit">
      <span class="countdown-number">${seconds}</span>
      <span class="countdown-label">Sec</span>
    </div>
  `;
}

// ===== Scroll-based Nav Styling =====
const nav = document.getElementById('nav');

function onScroll() {
  if (window.scrollY > 80) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', onScroll, { passive: true });

// ===== Mobile Nav Toggle =====
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    navLinks.classList.remove('open');
    // Reveal all fade-in elements when navigating via anchor links
    setTimeout(() => {
      document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    }, 300);
  }
});

// Reveal all fade-in elements when any anchor link is clicked
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (link) {
    setTimeout(() => {
      document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    }, 300);
  }
});

// ===== Fade-in on Scroll (IntersectionObserver) =====
function initFadeObserver() {
  const fadeElements = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  fadeElements.forEach((el) => fadeObserver.observe(el));
}

// ===== Envelope Replay =====
document.getElementById('envelope-replay').addEventListener('click', () => {
  localStorage.removeItem('seen-intro');
  // Reset envelope state
  envelope.classList.remove('opened');
  envelopeScreen.classList.remove('hidden');
  inviteOverlay.classList.remove('active');
  inviteOverlay.style.display = '';
  mainSite.classList.remove('visible');
  document.body.style.overflow = 'hidden';
  // Reset carousel to page 1
  showPage(0);
  // Scroll main site back to top for when they return
  window.scrollTo(0, 0);
});

// ===== RSVP Conditional Fields =====
const attendingSelect = document.getElementById('attending');
const attendingFields = document.getElementById('attending-fields');
const guestsSelect = document.getElementById('guests');
const day2CoupleWrap = document.getElementById('day2-couple-wrap');
const day2Rsvp = document.getElementById('day2-rsvp');
const day2SingleWrap = document.getElementById('day2-single-wrap');
const day2RsvpSingle = document.getElementById('day2-rsvp-single');

function updateRsvpFields() {
  const attending = attendingSelect.value === 'yes';
  attendingFields.style.display = attending ? 'block' : 'none';

  if (attending) {
    const guestCount = guestsSelect.value;
    // Show couple day2 options for 2 guests, single options for 1
    if (guestCount === '2') {
      day2CoupleWrap.style.display = '';
      day2Rsvp.name = 'day2';
      day2SingleWrap.style.display = 'none';
      day2RsvpSingle.name = '';
    } else {
      day2CoupleWrap.style.display = 'none';
      day2Rsvp.name = '';
      day2SingleWrap.style.display = '';
      day2RsvpSingle.name = 'day2';
    }
  }
}

attendingSelect.addEventListener('change', updateRsvpFields);
guestsSelect.addEventListener('change', updateRsvpFields);

// ===== RSVP Form Handling =====
// Replace this URL after deploying the Google Apps Script web app
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhKfDvsdxOOyOn_5wArSvx2BfZWOkeZ9Datt84X9NRONKXg4P6psyEEZpAxbYISK4QnQ/exec';

const form = document.getElementById('rsvp-form');
const formStatus = document.getElementById('form-status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formStatus.textContent = '';
  formStatus.className = 'form-status';

  const guest1Name = form.elements.guest1_name.value.trim();
  const email = form.elements.email.value.trim();
  const attending = form.elements.attending.value;

  if (!guest1Name || !email || !attending) {
    formStatus.textContent = 'Please fill in all required fields.';
    formStatus.classList.add('error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: new URLSearchParams(new FormData(form)),
    });

    if (response.ok) {
      formStatus.textContent = 'Thank you! Your RSVP has been received.';
      formStatus.classList.add('success');
      form.reset();
    } else {
      throw new Error('Server error');
    }
  } catch {
    formStatus.textContent =
      'Something went wrong. Please try again or contact us directly.';
    formStatus.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send RSVP';
  }
});

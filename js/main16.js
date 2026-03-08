// ===== Elements =====
var envelopeScreen = document.getElementById('envelope-screen');
var envelopeContainer = document.getElementById('envelope-container');
var envelope = document.getElementById('envelope');
var inviteOverlay = document.getElementById('invite-overlay');
var mainSite = document.getElementById('main-site');

// ===== Always start with envelope visible =====
document.body.style.overflow = 'hidden';

// ===== Envelope tap → open and show carousel =====
envelopeContainer.addEventListener('click', function () {
  envelope.classList.add('opened');
  setTimeout(function () {
    envelopeScreen.classList.add('hidden');
    inviteOverlay.classList.add('active');
  }, 1000);
});

// ===== Invite Carousel =====
var carouselPages = [
  document.getElementById('invite-page-1'),
  document.getElementById('invite-page-2'),
  document.getElementById('invite-page-3')
];
var dots = document.querySelectorAll('.dot');
var currentPage = 0;

function showPage(index) {
  for (var i = 0; i < carouselPages.length; i++) {
    carouselPages[i].classList.toggle('active', i === index);
  }
  for (var j = 0; j < dots.length; j++) {
    dots[j].classList.toggle('active', j === index);
  }
  currentPage = index;
}

document.getElementById('invite-next-1').addEventListener('click', function () { showPage(1); });
document.getElementById('invite-next-2').addEventListener('click', function () { showPage(2); });
document.getElementById('invite-enter').addEventListener('click', function () { enterSite(); });

// ===== Enter Site =====
function enterSite() {
  envelopeScreen.classList.add('hidden');
  inviteOverlay.classList.remove('active');
  inviteOverlay.style.display = 'none';
  mainSite.classList.add('visible');
  document.body.style.overflow = '';
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ===== Replay Invite (called from inline onclick) =====
function replayInvite() {
  envelope.classList.remove('opened');
  envelopeScreen.classList.remove('hidden');
  inviteOverlay.classList.remove('active');
  inviteOverlay.style.display = '';
  mainSite.classList.remove('visible');
  document.body.style.overflow = 'hidden';
  showPage(0);
  window.scrollTo(0, 0);
}

// ===== Countdown Timer =====
var WEDDING_DATE = new Date('2026-06-26T13:30:00+01:00');

function updateCountdown() {
  var el = document.getElementById('countdown');
  if (!el) return;

  var now = new Date();
  var diff = WEDDING_DATE - now;

  if (diff <= 0) {
    el.innerHTML = '<p style="font-size:1.2rem; letter-spacing:2px;">Today is the day!</p>';
    return;
  }

  var days = Math.floor(diff / (1000 * 60 * 60 * 24));
  var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  var minutes = Math.floor((diff / (1000 * 60)) % 60);
  var seconds = Math.floor((diff / 1000) % 60);

  el.innerHTML =
    '<div class="countdown-unit"><span class="countdown-number">' + days + '</span><span class="countdown-label">Days</span></div>' +
    '<div class="countdown-unit"><span class="countdown-number">' + hours + '</span><span class="countdown-label">Hours</span></div>' +
    '<div class="countdown-unit"><span class="countdown-number">' + minutes + '</span><span class="countdown-label">Min</span></div>' +
    '<div class="countdown-unit"><span class="countdown-number">' + seconds + '</span><span class="countdown-label">Sec</span></div>';
}

// ===== Scroll-based Nav Styling =====
var nav = document.getElementById('nav');
window.addEventListener('scroll', function () {
  if (window.scrollY > 80) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}, { passive: true });

// ===== Mobile Nav Toggle =====
var navToggle = document.getElementById('nav-toggle');
var navLinks = document.getElementById('nav-links');

navToggle.addEventListener('click', function () {
  navLinks.classList.toggle('open');
});

navLinks.addEventListener('click', function (e) {
  if (e.target.tagName === 'A') {
    navLinks.classList.remove('open');
  }
});

// ===== RSVP Form Handling =====
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIIqyblNJY39gBrEAneidX_cCwIW9cButK6DlGBQqA_5Xeq6iwEQ5TOGAg4yxjr_nCew/exec';

var form = document.getElementById('rsvp-form');
var formStatus = document.getElementById('form-status');

// Set up form to always submit into hidden iframe
var rsvpIframe = document.createElement('iframe');
rsvpIframe.name = 'rsvp-iframe';
rsvpIframe.style.display = 'none';
document.body.appendChild(rsvpIframe);

form.action = APPS_SCRIPT_URL;
form.method = 'POST';
form.target = 'rsvp-iframe';

form.addEventListener('submit', function (e) {
  formStatus.textContent = '';
  formStatus.className = 'form-status';

  var guest1Name = form.elements.guest1_name.value.trim();
  var email = form.elements.email.value.trim();
  var guest1Day1 = form.elements.guest1_day1.value;
  var guest1Day2 = form.elements.guest1_day2.value;

  if (!guest1Name || !email || !guest1Day1 || !guest1Day2) {
    e.preventDefault();
    formStatus.textContent = 'Please fill in all required fields.';
    formStatus.classList.add('error');
    return;
  }

  // Allow the form to submit naturally into the hidden iframe
  var submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  setTimeout(function () {
    formStatus.textContent = 'Thank you! Your RSVP has been received.';
    formStatus.classList.add('success');
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send RSVP';
  }, 2000);
});

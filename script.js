// === INTRO VIDEO LOGIC ===
document.addEventListener('DOMContentLoaded', () => {
  const coverSection = document.getElementById('coverSection');
  const coverButton = document.getElementById('coverButton');
  const videoSection = document.getElementById('videoSection');
  const introVideo = document.getElementById('introVideo');
  const heroSection = document.querySelector('.hero');
  const music = document.getElementById('bgMusic');

  if (!coverSection || !coverButton || !videoSection || !introVideo || !heroSection) {
    console.warn('Intro elements not found - skipping intro logic');
    return;
  }

  // Debug helper
  console.log('Intro ready — waiting for user click');

  // Ensure video is muted (allows play on user click)
  introVideo.muted = true;
  introVideo.playsInline = true;

  // Click / touch handler
  function handleCoverClick(e) {
    e.preventDefault();
    console.log('Cover clicked — starting sequence');

    // fade out cover image
    coverSection.classList.add('fade-out');

    // after fade hide cover and show video
    setTimeout(() => {
      coverSection.style.display = 'none';
      videoSection.style.display = 'flex';
      // ensure visible + fade-in
      videoSection.classList.remove('fade-out');
      videoSection.classList.add('fade-in');

      // attempt to play video; fallback to skipVideo on error
      introVideo.currentTime = 0;
      introVideo.play().then(() => {
        console.log('Video playing');
      }).catch((err) => {
        console.warn('Video play failed, skipping to hero', err);
        skipVideo();
      });

      // if you want the music to start on click as well (unmute and fade), start here:
      // unmute/fade after user interaction so browsers allow it
      try {
        music.muted = false;
        music.play().catch(()=>{});
      } catch(e) { /* ignore */ }
    }, 650);
  }

  coverButton.addEventListener('click', handleCoverClick);
  coverButton.addEventListener('touchstart', handleCoverClick);

  // When video finishes: hide video, show hero, enable scroll and start music fade
  introVideo.addEventListener('ended', () => {
    console.log('Video ended — switching to hero');
    videoSection.classList.add('fade-out');
    setTimeout(() => {
      videoSection.style.display = 'none';
      // reveal hero and allow scroll (your existing enableScroll function)
      if (typeof enableScroll === 'function') enableScroll();
      // optional: scroll to main-card or hero
      heroSection.scrollIntoView({ behavior: 'smooth' });
      // unmute and fade music in (if you have fadeInMusic)
      if (typeof fadeInMusic === 'function') fadeInMusic();
    }, 800);
  });

  // If video fails, skip directly to hero
  function skipVideo() {
    try {
      coverSection.style.display = 'none';
      videoSection.style.display = 'none';
      if (typeof enableScroll === 'function') enableScroll();
      heroSection.scrollIntoView({ behavior: 'smooth' });
      if (typeof fadeInMusic === 'function') fadeInMusic();
      console.log('Skipped video, showed hero');
    } catch (err) {
      console.error('skipVideo error', err);
    }
  }

  // OPTIONAL: If user refreshes and is already scrolled past hero, hide cover immediately
  if (window.scrollY > window.innerHeight * 0.5) {
    coverSection.style.display = 'none';
    videoSection.style.display = 'none';
  }
});



/*** Lagu (music) ***/
const music = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicToggle');
let isPlaying = false;
let hasInteracted = false;

// Load ucapan on page load
window.addEventListener('load', () => {
  loadUcapan();

  // If user refreshes mid-page and not at top, allow scrolling
  if (window.scrollY < window.innerHeight * 0.5) {
    // keep locked until user clicks Lihat Jemputan
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
    // set music button state visually (music is autoplay muted by markup)
    musicBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
});

// Toggle music button
musicBtn.addEventListener('click', () => {
  hasInteracted = true;
  if (isPlaying) {
    music.pause();
    musicBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  } else {
    music.muted = false;
    fadeInMusic();
    musicBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  }
  isPlaying = !isPlaying;
});

// Fade in music volume
function fadeInMusic() {
  music.muted = false;
  music.volume = 0;
  const fadeDuration = 2000; // ms
  const steps = 20;
  const stepTime = fadeDuration / steps;
  let currentStep = 0;
  music.play().catch(()=>{});
  const iv = setInterval(() => {
    currentStep++;
    music.volume = Math.min(1, currentStep / steps);
    if (currentStep >= steps) clearInterval(iv);
  }, stepTime);
}

// Start music + unlock scroll + scroll to main
function startMusicAndScroll() {
  hasInteracted = true;
  if (!isPlaying) {
    fadeInMusic();
    musicBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    isPlaying = true;
  }
  enableScroll();
  document.getElementById('main-card').scrollIntoView({ behavior: 'smooth' });
  showBottomNav();
}

// Enable / disable scroll helpers
function disableScroll() { document.body.classList.add('no-scroll'); }
function enableScroll() { document.body.classList.remove('no-scroll'); }

/*** List Ucapan */
const SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbx2IDA-6RXkLB8wu5OXi7m9j1GoZdXfjFBeZnYmHFx_MbtarnLJwEN54p8SRG2O7K4PlA/exec";

async function loadUcapan() {
  const list = document.getElementById('ucapanList');
  if (!list) return;
  list.innerHTML = '<p>Memuatkan ucapan…</p>';

  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(SCRIPT_ENDPOINT)}`, { cache: "no-store" });
    const data = await res.json();

    if (!data || !data.length) {
      list.innerHTML = '<p>Tiada ucapan lagi.</p>';
      return;
    }

    // Filter valid ucapan only (not empty or "-")
    const validUcapan = data.filter(item =>
      item.ucapan && item.ucapan.trim() !== '-' && item.ucapan.trim() !== ''
    );

    if (validUcapan.length === 0) {
      list.innerHTML = '<p>Tiada ucapan lagi.</p>';
      return;
    }

    // Reverse order (newest first) & show only latest 10
    const latestTen = validUcapan.reverse().slice(0, 10);

    // Display formatted list; new at top
    list.innerHTML = latestTen.map(item => `
      <div class="border-bottom pb-2 mb-2 fade-in">
        <p class="mb-1"><em>${escapeHtml(item.ucapan)}</em></p>
        <p class="mb-0 small fw-semibold text-muted">— ${escapeHtml(item.nama || '-')}</p>
      </div>
    `).join('');
    list.scrollTop = 0;

  } catch (err) {
    console.error('Load ucapan error', err);
    list.innerHTML = '<p>Gagal memuatkan ucapan.</p>';
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&','&amp;')
          .replaceAll('<','&lt;')
          .replaceAll('>','&gt;')
          .replaceAll('"','&quot;')
          .replaceAll("'",'&#039;');
}

/*** Form handling ***/
const hiddenIframe = document.getElementById('hidden_iframe');
if (hiddenIframe) {
  hiddenIframe.addEventListener('load', function(){
    setTimeout(loadUcapan, 800);
  });
}

function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const resBox = document.getElementById('formResponse');
  if (!submitBtn || !resBox) return;

  // Disable button + show loading spinner
  submitBtn.disabled = true;
  resBox.innerHTML = `
    <div class="text-center mt-3 text-muted">
      <div class="spinner-border spinner-border-sm" style="color:#f6b4c2;" role="status"></div>
      <span class="ms-2">Sedang menghantar...</span>
    </div>
  `;

  fetch(form.action, {
    method: "POST",
    body: new FormData(form),
    mode: "no-cors"
  })
  .then(() => {
    resBox.innerHTML = '<div class="alert alert-success mt-3">✅ Terima kasih! Ucapan anda telah dihantar.</div>';
    form.reset();
    setTimeout(() => resBox.innerHTML = '', 20000);
    submitBtn.disabled = false;
    setTimeout(loadUcapan, 1000);
  })
  .catch(() => {
    resBox.innerHTML = '<div class="alert alert-danger mt-3">❌ Tidak Dapat Menghantar (ERROR).</div>';
    submitBtn.disabled = false;
  });
}

// Disable/Enable Bilangan Based On Kehadiran
const hadirRadios = document.querySelectorAll('input[name="hadir"]');
const bilanganSelect = document.getElementById('bilangan');
if (hadirRadios && bilanganSelect) {
  hadirRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === "Tidak Hadir" && radio.checked) {
        bilanganSelect.value = "";
        bilanganSelect.disabled = true;
        bilanganSelect.classList.add("bg-light");
      } else if (radio.value === "Hadir" && radio.checked) {
        bilanganSelect.disabled = false;
        bilanganSelect.classList.remove("bg-light");
      }
    });
  });
}

/*** Nav bar visibility & highlighting ***/
const bottomNav = document.getElementById('bottomNav');
const navLinks = bottomNav ? bottomNav.querySelectorAll('a') : [];
let navVisible = false;

function showBottomNav() { if (bottomNav) { bottomNav.style.transform = 'translateY(0)'; navVisible = true; } }
function hideBottomNav() { if (bottomNav) { bottomNav.style.transform = 'translateY(100%)'; navVisible = false; } }

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const heroHeight = window.innerHeight * 0.4;
  if (scrollY > heroHeight && !navVisible) showBottomNav();
  else if (scrollY <= heroHeight && navVisible) hideBottomNav();
  highlightCurrentSection();
});

function highlightCurrentSection() {
  const sections = [
    { id: 'intro', linkIndex: 0 },
    { id: 'butiran', linkIndex: 1 },    // fixed id to match HTML
    { id: 'rsvp', linkIndex: 2 },
    { id: 'ucapanLi', linkIndex: 3 },
    { id: 'salamKaut', linkIndex: 4 }
  ];

  let scrollPos = window.scrollY + window.innerHeight / 2;
  sections.forEach(({ id, linkIndex }) => {
    const section = document.getElementById(id);
    const link = navLinks[linkIndex];
    if (!section || !link) return;
    const top = section.offsetTop;
    const height = section.offsetHeight;
    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

// set map/waze links (safe guard if elements exist)
const gmapBtn = document.getElementById('gmapBtn');
const wazeBtn = document.getElementById('wazeBtn');
if (gmapBtn) gmapBtn.href = 'https://maps.app.goo.gl/XZkmqM8EtiQRAhgU8';
if (wazeBtn) wazeBtn.href = 'https://ul.waze.com/ul?venue_id=66519070.665321776.636612&overview=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location';

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

document.addEventListener('DOMContentLoaded', () => {
  const coverSection = document.getElementById('coverSection');
  const coverButton = document.getElementById('coverButton');
  const videoSection = document.getElementById('videoSection');
  const introVideo = document.getElementById('introVideo');
  const heroSection = document.querySelector('.hero');
  const music = document.getElementById('bgMusic');

  // ensure video visible and not background-muted
  introVideo.muted = false;
  introVideo.controls = false;
  introVideo.playsInline = true;

  coverButton.addEventListener('click', () => {
    console.log("Clicked intro image → start video");

    // Fade out image cover
    coverSection.classList.add('fade-out');

    setTimeout(() => {
      coverSection.style.display = 'none';
      videoSection.style.display = 'block';
      introVideo.classList.add('fade-in');

      // Play video
      introVideo.currentTime = 0;
      introVideo.play().then(() => {
        console.log("Intro video playing");
      }).catch(err => {
        console.warn("Video failed to play:", err);
        skipVideo();
      });

      // Start background music fade-in
      try {
        music.volume = 0;
        music.play();
        fadeInMusic();
      } catch {}
    }, 600);
  });

  // When video ends, fade to hero
  introVideo.addEventListener('ended', () => {
    console.log("Video ended → show hero");
    videoSection.classList.add('fade-out');
    setTimeout(() => {
      videoSection.style.display = 'none';
      heroSection.scrollIntoView({ behavior: 'smooth' });
      enableScroll();
    }, 1000);
  });

  function skipVideo() {
    coverSection.style.display = 'none';
    videoSection.style.display = 'none';
    enableScroll();
    heroSection.scrollIntoView({ behavior: 'smooth' });
  }
});


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

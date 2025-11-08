/***Lagu ***/
const music = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicToggle');
let isPlaying = false;
let hasInteracted = false;

// Try to start muted on load (allowed by browsers)
window.addEventListener('load', async () => {
//   try {
//     music.volume = 0; // start silent
//     await music.play();
//     isPlaying = true;
//     musicBtn.textContent = '❚❚';
//   } catch (err) {
//     musicBtn.textContent = '▶';
//   }
  loadUcapan();
});

// Toggle button
musicBtn.addEventListener('click', () => {
  hasInteracted = true;
  if (isPlaying) {
    music.pause();
    musicBtn.textContent = '▶';
  } else {
    music.muted = false;
    fadeInMusic();
    musicBtn.textContent = '❚❚';
  }
  isPlaying = !isPlaying;
});

// Function: fade in music volume smoothly
function fadeInMusic() {
  music.muted = false;
  music.volume = 0;
  const fadeDuration = 3000; // 3 seconds
  const step = 0.05; // smooth increments
  const interval = setInterval(() => {
    if (music.volume < 1) {
      music.volume = Math.min(1, music.volume + step);
    } else {
      clearInterval(interval);
    }
  }, fadeDuration * step);
  music.play();
}

// Start music when button clicked
function startMusicAndScroll() {
  hasInteracted = true;
  if (!isPlaying) {
    fadeInMusic();
    isPlaying = true;
    musicBtn.textContent = '❚❚';
  }
  enableScroll(); // ✅ Allow scrolling now
  document.getElementById('main-card').scrollIntoView({ behavior: 'smooth' });
  showBottomNav();
}

// === Disable scroll until "Lihat Jemputan" clicked ===
function disableScroll() {
  document.body.classList.add('no-scroll');
}

function enableScroll() {
  document.body.classList.remove('no-scroll');
}

// ✅ Check scroll position when page loads
window.addEventListener('load', () => {
  // If user starts near top (hero section), disable scroll
  if (window.scrollY < window.innerHeight * 0.5) {
    disableScroll();
  } else {
    enableScroll(); // If refresh mid-page, allow scroll
    musicBtn.textContent = '▶';
  }
});


/*** List Ucapan */
const SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbx2IDA-6RXkLB8wu5OXi7m9j1GoZdXfjFBeZnYmHFx_MbtarnLJwEN54p8SRG2O7K4PlA/exec";

async function loadUcapan() {
    const list = document.getElementById('ucapanList');
    list.innerHTML = '<p>Memuatkan ucapan…</p>';

    try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(SCRIPT_ENDPOINT)}`, { cache: "no-store" });
    const data = await res.json();

    if (!data || !data.length) {
        list.innerHTML = '<p>Tiada ucapan lagi.</p>';
        return;
    }

    // ✅ Filter valid ucapan only (not empty or "-")
    const validUcapan = data.filter(item =>
        item.ucapan && item.ucapan.trim() !== '-' && item.ucapan.trim() !== ''
    );

    if (validUcapan.length === 0) {
        list.innerHTML = '<p>Tiada ucapan lagi.</p>';
        return;
    }

    // ✅ Reverse order (newest first) & show only latest 10
    const latestTen = validUcapan.reverse().slice(0, 10);

    // ✅ Display formatted list
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


/*** Form ***/
document.getElementById('hidden_iframe').addEventListener('load', function(){
    setTimeout(loadUcapan, 800);
});

// === Handle Form Submission ===
function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('submitBtn');
    const resBox = document.getElementById('formResponse');

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

// === Disable/Enable Bilangan Based on Kehadiran ===
const hadirRadios = document.querySelectorAll('input[name="hadir"]');
const bilanganSelect = document.getElementById('bilangan');

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

/***Nav Bar ***/
// === Bottom Navigation Visibility & Active Highlight ===
const bottomNav = document.getElementById('bottomNav');
const navLinks = bottomNav.querySelectorAll('a');
let navVisible = false;

function showBottomNav() {
    bottomNav.style.transform = 'translateY(0)';
    navVisible = true;
}

function hideBottomNav() {
    bottomNav.style.transform = 'translateY(100%)';
    navVisible = false;
}

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroHeight = window.innerHeight * 0.4;

    if (scrollY > heroHeight && !navVisible) showBottomNav();
    else if (scrollY <= heroHeight && navVisible) hideBottomNav();

    highlightCurrentSection();
});



function highlightCurrentSection() {
    const sections = [
    { id: 'intro', link: navLinks[0] },
    { id: 'lokasi', link: navLinks[1] },
    { id: 'rsvp', link: navLinks[2] },
    { id: 'ucapanLi', link: navLinks[3] },
    { id: 'salamKaut', link: navLinks[4] }
    ];

    let scrollPos = window.scrollY + window.innerHeight / 2;
    sections.forEach(({ id, link }) => {
    const section = document.getElementById(id);
    if (!section) return;
    const top = section.offsetTop;
    const height = section.offsetHeight;
    if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
    }
    });
}



document.getElementById('gmapBtn').href = 'https://maps.app.goo.gl/XZkmqM8EtiQRAhgU8';
document.getElementById('wazeBtn').href = 'https://ul.waze.com/ul?venue_id=66519070.665321776.636612&overview=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location';

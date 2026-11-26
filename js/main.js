document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get('to') || 'Tamu Spesial';
  const guestCategory = urlParams.get('cat') || 'Tamu Undangan';

  document.getElementById('guest-name').textContent = guestName;
  document.getElementById('header-guest-name').textContent = guestName;
  document.getElementById('guest-category').textContent = guestCategory;

  if (urlParams.get('to')) {
    document.getElementById('rsvp-name').value = guestName;
  }
  if (urlParams.get('cat')) {
    const catSelect = document.getElementById('rsvp-category');
    const optionExists = Array.from(catSelect.options).some(opt => opt.value === guestCategory);
    if (!optionExists) {
      const newOpt = new Option(guestCategory, guestCategory);
      catSelect.add(newOpt);
    }
    catSelect.value = guestCategory;
  }

  const coverSection = document.getElementById('cover-section');
  const openBtn = document.getElementById('open-invitation');
  const bgMusic = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-toggle');
  const musicIcon = document.getElementById('music-icon');
  let isPlaying = false;

  openBtn.addEventListener('click', () => {
    coverSection.classList.add('opened');
    document.body.classList.remove('locked');
    musicBtn.classList.remove('hidden');

    bgMusic.play().then(() => {
      isPlaying = true;
      musicIcon.textContent = '🔊';
    }).catch(() => {
      isPlaying = false;
      musicIcon.textContent = '🔇';
    });

    triggerReveal();
  });

  musicBtn.addEventListener('click', () => {
    if (isPlaying) {
      bgMusic.pause();
      musicIcon.textContent = '🔇';
    } else {
      bgMusic.play();
      musicIcon.textContent = '🔊';
    }
    isPlaying = !isPlaying;
  });

  const targetDate = new Date('June 2, 2027 18:30:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      document.getElementById('countdown').innerHTML = '<p>Acara Sedang Berlangsung!</p>';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  const calTitle = encodeURIComponent("Rafsya's Birthday Dinner");
  const calDetails = encodeURIComponent("Acara Ulang Tahun Rafsya di Hachi Grill Alam Sutera");
  const calLocation = encodeURIComponent("Hachi Grill Alam Sutera, Pakualam, Tangerang Selatan");
  const calDates = "20270602T113000Z/20270602T143000Z";
  document.getElementById('calendar-link').href = `https://www.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calDates}&details=${calDetails}&location=${calLocation}`;

  const copyBtn = document.getElementById('copy-btn');
  copyBtn.addEventListener('click', () => {
    const textToCopy = copyBtn.getAttribute('data-copy');
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Nomor rekening berhasil disalin!');
    });
  });

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function triggerReveal() {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
      const windowHeight = window.innerHeight;
      const elementTop = el.getBoundingClientRect().top;
      if (elementTop < windowHeight - 60) {
        el.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', triggerReveal);

  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpList = document.getElementById('rsvp-list');
  const rsvpCount = document.getElementById('rsvp-count');

  async function loadRsvps() {
    const { data, error } = await supabaseClient
      .from('rsvps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    rsvpCount.textContent = data.length;
    rsvpList.innerHTML = data.map(item => `
      <div class="rsvp-item">
        <div class="rsvp-item-header">
          <strong>${escapeHtml(item.name)} <small>(${escapeHtml(item.category)})</small></strong>
          <span class="status-tag ${item.status === 'Hadir' ? 'status-hadir' : 'status-tidak'}">
            ${escapeHtml(item.status)}
          </span>
        </div>
        <p>${escapeHtml(item.message)}</p>
      </div>
    `).join('');
  }

  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-rsvp');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';

    const payload = {
      name: document.getElementById('rsvp-name').value.trim(),
      category: document.getElementById('rsvp-category').value,
      status: document.getElementById('rsvp-status').value,
      message: document.getElementById('rsvp-message').value.trim()
    };

    const { error } = await supabaseClient.from('rsvps').insert([payload]);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Kirim Konfirmasi';

    if (!error) {
      showToast('Konfirmasi kehadiran terkirim!');
      document.getElementById('rsvp-message').value = '';
      loadRsvps();
    } else {
      showToast('Gagal mengirim data.');
    }
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadRsvps();
});
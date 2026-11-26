document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get('to') || 'Tamu Spesial';
  const guestCategory = urlParams.get('cat') || 'Tamu Undangan';

  const guestNameEl = document.getElementById('guest-name');
  const headerGuestNameEl = document.getElementById('header-guest-name');
  const guestCategoryEl = document.getElementById('guest-category');

  if (guestNameEl) guestNameEl.textContent = guestName;
  if (headerGuestNameEl) headerGuestNameEl.textContent = guestName;
  if (guestCategoryEl) guestCategoryEl.textContent = guestCategory;

  const rsvpNameInput = document.getElementById('rsvp-name');
  const rsvpCategorySelect = document.getElementById('rsvp-category');

  if (urlParams.get('to') && rsvpNameInput) {
    rsvpNameInput.value = guestName;
  }
  if (urlParams.get('cat') && rsvpCategorySelect) {
    const optionExists = Array.from(rsvpCategorySelect.options).some(opt => opt.value === guestCategory);
    if (!optionExists) {
      const newOpt = new Option(guestCategory, guestCategory);
      rsvpCategorySelect.add(newOpt);
    }
    rsvpCategorySelect.value = guestCategory;
  }

  const coverSection = document.getElementById('cover-section');
  const openBtn = document.getElementById('open-invitation');
  const bgMusic = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-toggle');
  const musicIcon = document.getElementById('music-icon');
  let isPlaying = false;

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (coverSection) coverSection.classList.add('opened');
      document.body.classList.remove('locked');
      if (musicBtn) musicBtn.classList.remove('hidden');

      if (bgMusic) {
        bgMusic.play().then(() => {
          isPlaying = true;
          if (musicIcon) musicIcon.textContent = '🔊';
        }).catch(() => {
          isPlaying = false;
          if (musicIcon) musicIcon.textContent = '🔇';
        });
      }

      triggerReveal();
    });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (!bgMusic) return;
      if (isPlaying) {
        bgMusic.pause();
        if (musicIcon) musicIcon.textContent = '🔇';
      } else {
        bgMusic.play();
        if (musicIcon) musicIcon.textContent = '🔊';
      }
      isPlaying = !isPlaying;
    });
  }

  const targetDate = new Date('June 2, 2027 18:30:00').getTime();

  function updateCountdown() {
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;

    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      countdownEl.innerHTML = '<p>Acara Sedang Berlangsung!</p>';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  const calendarLink = document.getElementById('calendar-link');
  if (calendarLink) {
    const calTitle = encodeURIComponent("Rafsya's Birthday Dinner");
    const calDetails = encodeURIComponent("Acara Ulang Tahun Rafsya di Hachi Grill Alam Sutera");
    const calLocation = encodeURIComponent("Hachi Grill Alam Sutera, Pakualam, Tangerang Selatan");
    const calDates = "20270602T113000Z/20270602T143000Z";
    calendarLink.href = `https://www.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calDates}&details=${calDetails}&location=${calLocation}`;
  }

  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const textToCopy = copyBtn.getAttribute('data-copy');
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Nomor rekening berhasil disalin!');
      }).catch(() => {
        showToast('Gagal menyalin nomor rekening.');
      });
    });
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
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

  async function loadRSVPs() {
    const { data, error } = await supabaseClient.from('rsvps').select('*');
    if (error) {
      showToast('Gagal memuat data RSVP.');
      return;
    }
    const rsvpCount = data.length;
    document.getElementById('rsvp-count').textContent = rsvpCount;
  }

  const rsvpForm = document.getElementById('rsvp-form');
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-rsvp');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
      }

      const payload = {
        name: document.getElementById('rsvp-name').value.trim(),
        category: document.getElementById('rsvp-category').value,
        status: document.getElementById('rsvp-status').value,
        message: document.getElementById('rsvp-message').value.trim()
      };

      try {
        const { error } = await supabaseClient.from('rsvps').insert([payload]);

        if (!error) {
          showToast('Konfirmasi kehadiran terkirim!');
          document.getElementById('rsvp-message').value = '';
        } else {
          showToast('Gagal: ' + error.message);
        }
      } catch (err) {
        showToast('Gagal mengirim data: ' + (err.message || 'kesalahan koneksi'));
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Kirim Konfirmasi';
        }
      }
    });
  }
});
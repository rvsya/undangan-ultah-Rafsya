const DEPLOYED_INVITE_URL = 'https://rvsya.github.io/undangan-ultah-Rafsya/';

document.addEventListener('DOMContentLoaded', () => {
  const csvInput = document.getElementById('csv-file');
  const uploadBtn = document.getElementById('upload-csv-btn');
  const guestTableBody = document.getElementById('guest-table-body');
  const totalGuestsBadge = document.getElementById('total-guests');
  const adminRsvpBody = document.getElementById('admin-rsvp-body');

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function formatPhone(phone) {
    let clean = String(phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  }

  function getBaseInviteUrl() {
    if (DEPLOYED_INVITE_URL && !DEPLOYED_INVITE_URL.includes('DOMAIN_DEPLOY_KAMU')) {
      return DEPLOYED_INVITE_URL;
    }
    return window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  uploadBtn.addEventListener('click', () => {
    const file = csvInput.files[0];
    if (!file) {
      showToast('Pilih file .csv terlebih dahulu!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result || '';
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const guestsToInsert = [];

      lines.forEach((line, index) => {
        const separator = line.includes(';') ? ';' : ',';
        const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));

        if (index === 0 && cols[0] && cols[0].toLowerCase() === 'nama') return;

        if (cols.length >= 3 && cols[0] && cols[2]) {
          guestsToInsert.push({
            name: cols[0],
            category: cols[1] || 'Tamu Undangan',
            phone: formatPhone(cols[2])
          });
        }
      });

      if (guestsToInsert.length === 0) {
        showToast('Format CSV tidak valid!');
        return;
      }

      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Mengupload...';

      try {
        const { error } = await supabaseClient.from('guests').insert(guestsToInsert);
        if (error) {
          showToast('Gagal upload: ' + error.message);
        } else {
          showToast(`${guestsToInsert.length} tamu berhasil diimport!`);
          csvInput.value = '';
          await loadGuests();
        }
      } catch (err) {
        showToast('Terjadi kesalahan koneksi ke database.');
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload ke Database';
      }
    };

    reader.onerror = () => {
      showToast('Gagal membaca file CSV.');
    };

    reader.readAsText(file);
  });

  async function loadGuests() {
    try {
      const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Gagal memuat tamu: ' + error.message);
        return;
      }

      const list = data || [];
      totalGuestsBadge.textContent = `${list.length} Tamu`;
      const baseUrl = getBaseInviteUrl();

      guestTableBody.innerHTML = list.map(guest => {
        const inviteLink = `${baseUrl}?to=${encodeURIComponent(guest.name)}&cat=${encodeURIComponent(guest.category)}`;
        const message = `Halo *${guest.name}*! 👋\n\nAku mengundangmu untuk hadir di acara ulang tahunku pada:\n🗓️ Rabu, 2 Juni 2027\n📍 Hachi Grill Alam Sutera\n\nBuka undangan & konfirmasi kehadiranmu melalui link berikut:\n${inviteLink}\n\nDitunggu kehadirannya ya! 🙌`;
        const waUrl = `https://wa.me/${encodeURIComponent(guest.phone)}?text=${encodeURIComponent(message)}`;

        return `
          <tr>
            <td><strong>${escapeHtml(guest.name)}</strong></td>
            <td>${escapeHtml(guest.category)}</td>
            <td>${escapeHtml(guest.phone)}</td>
            <td>
              <div class="action-group">
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-wa">Kirim WA</a>
                <button type="button" class="btn-copy-link" data-link="${escapeHtml(inviteLink)}">Salin Link</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      document.querySelectorAll('.btn-copy-link').forEach(btn => {
        btn.addEventListener('click', () => {
          const link = btn.getAttribute('data-link');
          navigator.clipboard.writeText(link).then(() => {
            showToast('Link undangan disalin!');
          }).catch(() => {
            showToast('Gagal menyalin link.');
          });
        });
      });
    } catch (err) {
      showToast('Gagal terhubung ke Supabase.');
    }
  }

  async function loadAdminRsvps() {
    try {
      const { data, error } = await supabaseClient
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Gagal memuat RSVP: ' + error.message);
        return;
      }

      const list = data || [];
      const hadirCount = list.filter(d => d.status === 'Hadir').length;
      const tidakCount = list.filter(d => d.status === 'Tidak Hadir').length;

      document.getElementById('stat-hadir').textContent = `Hadir: ${hadirCount}`;
      document.getElementById('stat-tidak').textContent = `Tidak: ${tidakCount}`;

      adminRsvpBody.innerHTML = list.map(item => `
        <tr>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td>${escapeHtml(item.category)}</td>
          <td>
            <span class="status-tag ${item.status === 'Hadir' ? 'status-hadir' : 'status-tidak'}">
              ${escapeHtml(item.status)}
            </span>
          </td>
          <td>${escapeHtml(item.message || '-')}</td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Gagal memuat data RSVP.');
    }
  }

  loadGuests();
  loadAdminRsvps();
});
document.addEventListener('DOMContentLoaded', () => {
  const csvInput = document.getElementById('csv-file');
  const uploadBtn = document.getElementById('upload-csv-btn');
  const guestTableBody = document.getElementById('guest-table-body');
  const totalGuestsBadge = document.getElementById('total-guests');
  const adminRsvpBody = document.getElementById('admin-rsvp-body');

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function formatPhone(phone) {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  }

  uploadBtn.addEventListener('click', () => {
    const file = csvInput.files[0];
    if (!file) {
      showToast('Pilih file .csv terlebih dahulu!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const guestsToInsert = [];

      lines.forEach((line, index) => {
        const separator = line.includes(';') ? ';' : ',';
        const cols = line.split(separator).map(c => c.trim());

        if (index === 0 && cols[0].toLowerCase() === 'nama') return;

        if (cols.length >= 3) {
          guestsToInsert.push({
            name: cols[0],
            category: cols[1],
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

      const { error } = await supabaseClient.from('guests').insert(guestsToInsert);

      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload ke Database';

      if (!error) {
        showToast(`${guestsToInsert.length} tamu berhasil diimport!`);
        csvInput.value = '';
        loadGuests();
      } else {
        showToast('Gagal menyimpan ke Supabase.');
      }
    };

    reader.readAsText(file);
  });

  async function loadGuests() {
    const { data, error } = await supabaseClient
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    totalGuestsBadge.textContent = `${data.length} Tamu`;
    const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');

    guestTableBody.innerHTML = data.map(guest => {
      const inviteLink = `${baseUrl}?to=${encodeURIComponent(guest.name)}&cat=${encodeURIComponent(guest.category)}`;
      const message = `Halo *${guest.name}*! 👋\n\nTanpa mengurangi rasa hormat, aku mengundangmu untuk hadir di acara ulang tahunku pada:\n🗓️ Rabu, 2 Juni 2027\n📍 Hachi Grill Alam Sutera\n\nBuka undangan & konfirmasi kehadiranmu melalui link berikut:\n${inviteLink}\n\nDitunggu kehadirannya ya! 🙌`;
      const waUrl = `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`;

      return `
        <tr>
          <td><strong>${guest.name}</strong></td>
          <td>${guest.category}</td>
          <td>${guest.phone}</td>
          <td>
            <a href="${waUrl}" target="_blank" class="btn-wa">Kirim WA</a>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadAdminRsvps() {
    const { data, error } = await supabaseClient
      .from('rsvps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    const hadirCount = data.filter(d => d.status === 'Hadir').length;
    const tidakCount = data.filter(d => d.status === 'Tidak Hadir').length;

    document.getElementById('stat-hadir').textContent = `Hadir: ${hadirCount}`;
    document.getElementById('stat-tidak').textContent = `Tidak: ${tidakCount}`;

    adminRsvpBody.innerHTML = data.map(item => `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>
          <span class="status-tag ${item.status === 'Hadir' ? 'status-hadir' : 'status-tidak'}">
            ${item.status}
          </span>
        </td>
        <td>${item.message || '-'}</td>
      </tr>
    `).join('');
  }

  loadGuests();
  loadAdminRsvps();
});
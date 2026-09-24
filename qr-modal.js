function showQrModal(src, label) {
  const m = document.getElementById('qrModal');
  const img = document.getElementById('qrModalImg');
  const lbl = document.getElementById('qrModalLabel');
  if (!m || !img) return;
  img.src = src;
  lbl.textContent = label || '';
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function hideQrModal() {
  const m = document.getElementById('qrModal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
  const img = document.getElementById('qrModalImg'); if (img) img.src = '';
}

// Delegated click handler for any QR images added to the page
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t && (t.matches && (t.matches('#contactQrWrap img') || t.matches('#footerQrWrap img') || t.matches('.wechat-qr-img') || t.matches('.contact-qr-img')))) {
    showQrModal(t.src, t.alt || t.dataset.label || 'QR Code');
  }
});

// Close modal with Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const m = document.getElementById('qrModal');
    if (m && m.classList.contains('open')) hideQrModal();
  }
});

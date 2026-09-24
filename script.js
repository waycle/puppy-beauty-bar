// ===== PAYMENT CONFIG =====
// Fill in these values before going live.
const STRIPE_PUBLISHABLE_KEY    = '';   // pk_live_... from your Stripe dashboard
const PAYMENT_ENDPOINT          = '';   // URL of your /create-payment-intent backend endpoint
const DEPOSIT_AMOUNT_GBP        = 10;   // Deposit amount in GBP taken at booking
const WECHAT_QR_IMG_URL         = '';   // Path/URL to your WeChat Pay merchant QR image
const EMAILJS_SERVICE_ID        = '';   // From emailjs.com → Email Services
const EMAILJS_CLIENT_TEMPLATE   = '';   // Template ID sent to client after booking
const EMAILJS_BUSINESS_TEMPLATE = '';   // Template ID sent to your business email
const EMAILJS_PUBLIC_KEY        = '';   // EmailJS public (user) key

// ===== ADMIN CONFIG =====
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'cline1999';

// ===== MEMBERSHIP DEFAULTS =====
const DEFAULT_MEMBERSHIP_DATA = {
  tiers: [
    { id:'gold',   name:'Gold Member',   tagline:'Best value for regular clients', price:'TBC', discount:20, featured:true,
      perks:['20% off all services','Priority booking access','Free birthday lash treatment','Exclusive member events','Early access to new treatments'] },
    { id:'silver', name:'Silver Member', tagline:'Perfect for monthly visits',      price:'TBC', discount:10, featured:false,
      perks:['10% off all services','Priority booking access','Member-only offers'] }
  ],
  events: []
};

// ===== CONTACT DEFAULTS =====
const DEFAULT_CONTACT_INFO = {
  phone:'+447456347231',
  email:'cline.studio.limited@gmail.com',
  address:'', city:'', hours:'Mon–Sun: 9:00 AM – 5:00 PM',
  instagram:'https://www.instagram.com/puppybeautybarbirmingham?igsh=MWdoOXpwcHp2eGt2NQ%3D%3D&utm_source=qr',
  facebook:'', tiktok:'', whatsapp:'+447456347231', mapsUrl:'',
  // Optional QR image URLs for display (set in Admin → Contact)
  wechatQr:'', whatsappQr:'', instagramQr:''
};

// ===== PRODUCT DEFAULTS =====
const DEFAULT_PRODUCTS = [
  { id:'pp1', emoji:'💕', name:'Lash Foam Cleanser',          cat:'Aftercare',   desc:'Gentle, oil-free formula that keeps your extensions clean and lasting longer.',    price:'£12.00', badge:'Best Seller', hidden:false, inStock:true },
  { id:'pp2', emoji:'🪮', name:'Lash Spoolie Set',             cat:'Tools',       desc:'Soft, reusable spoolies for daily lash grooming and aftercare maintenance.',       price:'£6.00',  badge:'',            hidden:false, inStock:true },
  { id:'pp3', emoji:'✨', name:'Lash Sealant Coating',         cat:'Aftercare',   desc:'Protective nano coating that extends the life of your lash set by up to 50%.',    price:'£18.00', badge:'New',          hidden:false, inStock:true },
  { id:'pp4', emoji:'🌸', name:'Oil-Free Eye Makeup Remover',  cat:'Aftercare',   desc:'Safe for lash extensions — removes makeup without loosening your lash bond.',     price:'£10.00', badge:'',            hidden:false, inStock:true },
  { id:'pp5', emoji:'💎', name:'Lash Extension Primer',        cat:'Professional',desc:'Pre-treatment primer that boosts adhesive bonding for longer-lasting sets.',       price:'£14.00', badge:'',            hidden:false, inStock:true },
  { id:'pp6', emoji:'🎁', name:'Lash Care Gift Set',           cat:'Gift Sets',   desc:'The perfect gift: cleanser, spoolies, and a sealant beautifully packaged.',        price:'£32.00', badge:'Gift',         hidden:false, inStock:true },
];

// ===== ADMIN STATE =====
let _adminTab = 'availability';
let _availDate = '';

// ===== PROMO STATE =====
let _promoDiscount = 0;
let _appliedPromoCode = '';

function _effectiveDeposit() {
  return Math.max(0, _cfg().depositAmount - _promoDiscount);
}

// ===== HELPERS =====
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function safeStore(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch(e) {
    if (e.name === 'QuotaExceededError' || e.code === 22)
      alert('Storage is full. Please delete some photos before adding more.');
    return false;
  }
}

function compressImage(file, maxPx, quality, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else       { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== NAV SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 400);
});

// ===== MOBILE MENU =====
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const navOverlay = document.getElementById('navOverlay');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  navOverlay.classList.toggle('open', isOpen);
  hamburger.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

function closeMenu() {
  mobileMenu.classList.remove('open');
  navOverlay.classList.remove('open');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== GALLERY =====
const GALLERY_DEFAULTS = [
  { bg:'linear-gradient(135deg,#d4a5a5,#c4846d)', icon:'✨', caption:'Classic Extensions',  cat:'extensions', cls:'' },
  { bg:'linear-gradient(135deg,#b5c4e0,#8fa5c9)', icon:'💫', caption:'Volume Lashes',        cat:'extensions', cls:'' },
  { bg:'linear-gradient(135deg,#e8c4b8,#d4906c)', icon:'🌟', caption:'Hybrid Set',           cat:'extensions', cls:' gallery-large' },
  { bg:'linear-gradient(135deg,#f4c2c2,#e89b9b)', icon:'🪄', caption:'Lash Lift',            cat:'lift',       cls:'' },
  { bg:'linear-gradient(135deg,#c8e6c9,#88c98a)', icon:'🌸', caption:'Natural Classic Set',  cat:'extensions', cls:'' },
  { bg:'linear-gradient(135deg,#f5e6d3,#e4c4a0)', icon:'✦',  caption:'Lash Tint',            cat:'lift',       cls:'' },
  { bg:'linear-gradient(135deg,#e8d5e8,#c4a0c4)', icon:'💜', caption:'Russian Volume',       cat:'extensions', cls:' gallery-tall' },
  { bg:'linear-gradient(135deg,#ffd6cc,#ffb3a0)', icon:'✨', caption:'Wispy Style',          cat:'extensions', cls:'' },
  { bg:'linear-gradient(135deg,#d4c5b0,#b8a088)', icon:'🌿', caption:'Lift & Tint',          cat:'lift',       cls:'' },
];

function getGalleryPhotos() {
  try { const s = localStorage.getItem('ppb_gallery_photos'); return s ? JSON.parse(s) : []; }
  catch(e) { return []; }
}
function saveGalleryPhotos(photos) { return safeStore('ppb_gallery_photos', JSON.stringify(photos)); }

function renderGallery() {
  const photos = getGalleryPhotos();
  const grid   = document.getElementById('galleryGrid');
  if (!grid) return;

  const items = photos.length > 0 ? photos : GALLERY_DEFAULTS;
  const useReal = photos.length > 0;

  grid.innerHTML = items.map((p, i) => {
    const cls     = useReal ? (p.cls || '') : p.cls;
    const cat     = useReal ? p.category : p.cat;
    const bgStyle = useReal ? '' : ` style="background:${p.bg}"`;
    const inner   = useReal
      ? `<img src="${p.dataUrl}" alt="${esc(p.caption)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
      : `<div class="gallery-placeholder">${p.icon ? p.icon + '<br>' : ''}${esc(p.caption)}</div>`;
    return `<div class="gallery-item${cls}" data-cat="${esc(cat)}" onclick="openLightbox(${i})">
      <div class="gallery-img"${bgStyle}>${inner}</div>
      <div class="gallery-overlay"><span>${esc(p.caption)}</span></div>
    </div>`;
  }).join('');

  // Update filter counts
  const total = items.length;
  const ext   = items.filter(p => (useReal ? p.category : p.cat) === 'extensions').length;
  const lift  = items.filter(p => (useReal ? p.category : p.cat) === 'lift').length;
  const cntAll = document.getElementById('cnt-all');
  const cntExt = document.getElementById('cnt-extensions');
  const cntLft = document.getElementById('cnt-lift');
  if (cntAll) cntAll.textContent = total;
  if (cntExt) cntExt.textContent = ext;
  if (cntLft) cntLft.textContent = lift;

  // Re-attach scroll reveal
  grid.querySelectorAll('.gallery-item').forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    el.dataset.delay = (i % 4) * 80;
    revealObserver.observe(el);
  });
}

// ===== GALLERY FILTER =====
const galleryGrid = document.getElementById('galleryGrid');
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    galleryGrid.style.opacity = '0';
    galleryGrid.style.transform = 'translateY(8px)';
    setTimeout(() => {
      const filter = btn.dataset.filter;
      document.querySelectorAll('.gallery-item').forEach(item => {
        item.classList.toggle('hidden', filter !== 'all' && item.dataset.cat !== filter);
      });
      galleryGrid.style.opacity = '1';
      galleryGrid.style.transform = 'translateY(0)';
    }, 220);
  });
});

// ===== LIGHTBOX =====
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  renderLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
function changeSlide(dir) {
  const photos = getGalleryPhotos();
  const len = photos.length > 0 ? photos.length : GALLERY_DEFAULTS.length;
  currentIndex = (currentIndex + dir + len) % len;
  renderLightbox();
}
function renderLightbox() {
  const photos = getGalleryPhotos();
  const items  = photos.length > 0 ? photos : GALLERY_DEFAULTS;
  const d      = items[currentIndex] || items[0];
  const img    = document.getElementById('lbImg');
  if (d.dataUrl) {
    img.style.background = '#111';
    img.innerHTML = `<img src="${d.dataUrl}" alt="${esc(d.caption)}" style="width:100%;height:100%;object-fit:contain;border-radius:inherit">`;
  } else {
    img.style.background = d.bg;
    img.innerHTML = d.icon
      ? `<div style="text-align:center;color:rgba(255,255,255,.9);font-weight:600">
           <div style="font-size:3.5rem;margin-bottom:10px">${d.icon}</div>
           <div style="font-size:1.1rem;letter-spacing:.5px">${esc(d.caption)}</div>
           <div style="font-size:.78rem;margin-top:8px;opacity:.5">Upload real photos via the Admin panel</div>
         </div>`
      : '';
  }
  document.getElementById('lbCaption').textContent = d.caption;
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape')    closeLightbox();
  if (e.key === 'ArrowLeft') changeSlide(-1);
  if (e.key === 'ArrowRight') changeSlide(1);
});

// ===== TIME SLOTS — 9:00 AM to 5:45 PM, every 15 min =====
const ALL_SLOTS = [
  '9:00 AM','9:15 AM','9:30 AM','9:45 AM',
  '10:00 AM','10:15 AM','10:30 AM','10:45 AM',
  '11:00 AM','11:15 AM','11:30 AM','11:45 AM',
  '12:00 PM','12:15 PM','12:30 PM','12:45 PM',
  '1:00 PM','1:15 PM','1:30 PM','1:45 PM',
  '2:00 PM','2:15 PM','2:30 PM','2:45 PM',
  '3:00 PM','3:15 PM','3:30 PM','3:45 PM',
  '4:00 PM','4:15 PM','4:30 PM','4:45 PM',
  '5:00 PM','5:15 PM','5:30 PM','5:45 PM',
];

function getAvailableSlots() {
  try { const s = localStorage.getItem('ppb_availability'); return s ? JSON.parse(s) : {}; }
  catch { return {}; }
}
function saveAvailability(data) { safeStore('ppb_availability', JSON.stringify(data)); }

// ===== PAYMENT & ADMIN SETTINGS (admin-editable via Settings tab) =====
function getPaymentSettings() {
  try { const s = localStorage.getItem('ppb_payment_settings'); return s ? JSON.parse(s) : {}; }
  catch { return {}; }
}
function savePaymentSettings(d) { safeStore('ppb_payment_settings', JSON.stringify(d)); }

function getAdminCredentials() {
  try { const s = localStorage.getItem('ppb_admin_creds'); return s ? JSON.parse(s) : { username: ADMIN_USERNAME, password: ADMIN_PASSWORD }; }
  catch { return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD }; }
}
function saveAdminCredentials(c) { safeStore('ppb_admin_creds', JSON.stringify(c)); }

// Merges hardcoded defaults with admin-saved overrides from localStorage
function _cfg() {
  const s = getPaymentSettings();
  return {
    stripeKey:        s.stripeKey        || STRIPE_PUBLISHABLE_KEY,
    paymentEndpoint:  s.paymentEndpoint  || PAYMENT_ENDPOINT,
    depositAmount:    s.depositAmount    != null ? Number(s.depositAmount) : DEPOSIT_AMOUNT_GBP,
    wechatQrUrl:      s.wechatQrUrl      || WECHAT_QR_IMG_URL,
    emailjsServiceId: s.emailjsServiceId || EMAILJS_SERVICE_ID,
    emailjsClientTpl: s.emailjsClientTpl || EMAILJS_CLIENT_TEMPLATE,
    emailjsBizTpl:    s.emailjsBizTpl    || EMAILJS_BUSINESS_TEMPLATE,
    emailjsPublicKey: s.emailjsPublicKey || EMAILJS_PUBLIC_KEY,
    businessEmail:    s.businessEmail    || 'cline.studio.limited@gmail.com',
    enableCard:       s.enableCard       !== false,
    enableWechat:     s.enableWechat     !== false,
    reminderTpl:      s.reminderTpl      || '',
    customTermsAllergy: s.customTermsAllergy || '',
    promoCodes:       Array.isArray(s.promoCodes) ? s.promoCodes : [],
  };
}

function parseDurationMins(str) {
  if (!str) return 60;
  const lower = str.toLowerCase();
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*h(?:ou?r?s?)?/);
  if (hourMatch) {
    const minMatch = lower.match(/(\d+)\s*m(?:in(?:utes?)?)?/);
    return Math.round(parseFloat(hourMatch[1]) * 60) + (minMatch ? parseInt(minMatch[1]) : 0);
  }
  const nums = (str.match(/\d+/g) || []).map(Number);
  return nums.length ? Math.max(...nums) : 60;
}

function getBookings() {
  try { const s = localStorage.getItem('ppb_bookings'); return s ? JSON.parse(s) : []; }
  catch { return []; }
}
function saveBookings(b) { safeStore('ppb_bookings', JSON.stringify(b)); }

function getSlotsForDate(date) {
  const avail = getAvailableSlots();
  return avail.hasOwnProperty(date) ? avail[date] : [];
}

function getAvailableSlotsForDate(date, serviceDurationMins) {
  const adminSlots = getSlotsForDate(date);
  const bookings = getBookings().filter(b => b.date === date);
  const blocked = new Set();
  bookings.forEach(b => {
    const si = ALL_SLOTS.indexOf(b.time);
    if (si < 0) return;
    const n = Math.ceil(b.durationMins / 15);
    for (let i = si; i < si + n && i < ALL_SLOTS.length; i++) blocked.add(ALL_SLOTS[i]);
  });
  const adminSet = new Set(adminSlots);
  const durSlots = serviceDurationMins ? Math.ceil(serviceDurationMins / 15) : 1;
  return adminSlots.filter(s => {
    if (blocked.has(s)) return false;
    if (durSlots <= 1) return true;
    const si = ALL_SLOTS.indexOf(s);
    // Ensure service fits within available hours
    if (si + durSlots > ALL_SLOTS.length) return false;
    // Ensure all intermediate slots are enabled and not blocked
    for (let i = si + 1; i < si + durSlots; i++) {
      if (!adminSet.has(ALL_SLOTS[i]) || blocked.has(ALL_SLOTS[i])) return false;
    }
    return true;
  });
}

function updateTimeSlots() {
  const dateInput     = document.getElementById('bookingDate');
  const timeSelect    = document.getElementById('bookingTime');
  const serviceSelect = document.getElementById('bookingServiceSelect');
  const date = dateInput ? dateInput.value : '';
  if (!date) { timeSelect.innerHTML = '<option value="">— Select Date First —</option>'; return; }
  let durationMins = 0;
  if (serviceSelect && serviceSelect.value) {
    const svc = getServices().find(s => s.name === serviceSelect.value);
    if (svc) durationMins = parseDurationMins(svc.duration);
  }
  const slots = getAvailableSlotsForDate(date, durationMins);
  timeSelect.innerHTML = '<option value="">— Select Time —</option>';
  if (!slots.length) {
    timeSelect.innerHTML = '<option value="">— No slots available this day —</option>';
    return;
  }
  slots.forEach(slot => { const o = document.createElement('option'); o.value = slot; o.textContent = slot; timeSelect.appendChild(o); });
}

const dateInput = document.getElementById('bookingDate');
if (dateInput) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().split('T')[0];
  updateTimeSlots();
}

// ===== BOOKING MULTI-STEP FLOW =====
let bookingStep     = 1;
let bookingFormData = {};
let _stripe         = null;
let _stripeElements = null;
let _stripeCard     = null;
let _activePayMethod = 'card';

function goToPaymentStep() {
  const firstName = document.getElementById('bookingFirstName').value.trim();
  const lastName  = document.getElementById('bookingLastName').value.trim();
  const phone     = document.getElementById('bookingPhone').value.trim();
  const email     = document.getElementById('bookingEmail').value.trim();
  const service   = document.getElementById('bookingServiceSelect').value;
  const date      = document.getElementById('bookingDate').value;
  const time      = document.getElementById('bookingTime').value;
  const notes     = document.getElementById('bookingNotes').value.trim();
  const terms     = document.getElementById('termsCheck').checked;

  if (!firstName || !lastName) { alert('Please enter your full name.'); return; }
  if (!phone || phone.replace(/[\s\-+()]/g,'').length < 7) { alert('Please enter a valid phone number.'); return; }
  const _emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!email || !_emailRe.test(email)) { alert('Please enter a valid email address.'); return; }
  if (!service)  { alert('Please select a service.'); return; }
  if (!date)     { alert('Please select a preferred date.'); return; }
  if (!time || time.startsWith('—')) { alert('Please select an available time slot.'); return; }
  if (!terms)    { alert('Please read and accept the Terms & Conditions.'); return; }

  bookingFormData = { firstName, lastName, phone, email, service, date, time, notes };

  // Reset promo state for each new payment step entry
  _promoDiscount = 0; _appliedPromoCode = '';
  const promoInput = document.getElementById('promoInput');
  if (promoInput) promoInput.value = '';
  const promoMsg = document.getElementById('promoMsg');
  if (promoMsg) { promoMsg.textContent = ''; promoMsg.className = 'promo-msg'; }

  const cfg = _cfg();
  document.getElementById('paySummaryName').textContent     = firstName + ' ' + lastName;
  document.getElementById('paySummaryService').textContent  = service;
  document.getElementById('paySummaryDateTime').textContent = _fmtDate(date) + ' at ' + time;
  document.getElementById('payDepositDisplay').textContent  = '£' + cfg.depositAmount;
  document.getElementById('payCardBtn').textContent         = 'Pay £' + cfg.depositAmount + ' Deposit';

  _renderWechatQr();
  document.getElementById('payTab_card').style.display   = cfg.enableCard   ? '' : 'none';
  document.getElementById('payTab_wechat').style.display = cfg.enableWechat ? '' : 'none';
  if (cfg.enableCard)        selectPaymentMethod('card');
  else if (cfg.enableWechat) selectPaymentMethod('wechat');
  const demoNotice = document.getElementById('demoModeNotice');
  if (demoNotice) demoNotice.style.display = (!cfg.stripeKey || !cfg.paymentEndpoint) ? '' : 'none';

  document.getElementById('bookingForm').style.display    = 'none';
  document.getElementById('bookingPayment').style.display = '';
  document.getElementById('bStep1Ind').classList.remove('active');
  document.getElementById('bStep2Ind').classList.add('active');
  bookingStep = 2;

  document.getElementById('booking').scrollIntoView({ behavior:'smooth', block:'start' });
  if (cfg.enableCard) _initStripe();
}

function backToBookingDetails() {
  document.getElementById('bookingPayment').style.display = 'none';
  document.getElementById('bookingForm').style.display    = '';
  document.getElementById('bStep2Ind').classList.remove('active');
  document.getElementById('bStep1Ind').classList.add('active');
  bookingStep = 1;
}

function _fmtDate(str) {
  if (!str) return str;
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'long', year:'numeric' });
}

function selectPaymentMethod(method) {
  _activePayMethod = method;
  ['card','wechat'].forEach(m => {
    document.getElementById('payTab_'   + m).classList.toggle('active', m === method);
    document.getElementById('payPanel_' + m).style.display = m === method ? '' : 'none';
  });
}

function _renderWechatQr() {
  const wrap = document.getElementById('wechatQrWrap');
  if (!wrap) return;
  const url = _cfg().wechatQrUrl;
  wrap.innerHTML = url
    ? `<img src="${url}" alt="WeChat Pay QR" class="wechat-qr-img">`
    : `<div class="wechat-qr-placeholder">
         <span style="font-size:2.8rem">💚</span>
         <p>WeChat Pay QR</p>
         <small>Upload your QR image URL in Admin → Settings</small>
       </div>`;
}

function _initStripe() {
  if (_stripe || !_cfg().stripeKey) return;
  if (typeof Stripe !== 'undefined') { _doInitStripe(); return; }
  const s = document.createElement('script');
  s.src = 'https://js.stripe.com/v3/';
  s.onload = _doInitStripe;
  document.head.appendChild(s);
}
function _doInitStripe() {
  if (_stripe) return;
  _stripe = Stripe(_cfg().stripeKey);
  _stripeElements = _stripe.elements();
  _stripeCard = _stripeElements.create('card', {
    style: {
      base: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '16px', color: '#1C1C1E',
        '::placeholder': { color: '#9A9696' }
      },
      invalid: { color: '#c44' }
    },
    hidePostalCode: true
  });
  _stripeCard.mount('#stripe-card-element');
  _stripeCard.on('change', e => {
    document.getElementById('stripe-card-errors').textContent = e.error ? e.error.message : '';
  });
}

async function processCardPayment() {
  const cfg = _cfg();
  const amount = _effectiveDeposit();
  const btn = document.getElementById('payCardBtn');
  btn.disabled = true; btn.textContent = 'Processing…';
  document.getElementById('stripe-card-errors').textContent = '';

  // Free booking — promo covers full deposit
  if (amount === 0) {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Complete Booking (Free)';
      _onPaymentSuccess('Promo Code — ' + _appliedPromoCode);
    }, 600);
    return;
  }

  // Demo mode: no Stripe key or no backend endpoint
  if (!cfg.stripeKey || !cfg.paymentEndpoint) {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Pay £' + amount + ' Deposit';
      _onPaymentSuccess('Card (Demo)');
    }, 1800);
    return;
  }

  try {
    const res = await fetch(cfg.paymentEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:         amount * 100,
        currency:       'gbp',
        customer_email: bookingFormData.email,
        description:    `Deposit – ${bookingFormData.service} on ${bookingFormData.date}`,
        metadata: {
          firstName: bookingFormData.firstName,
          lastName:  bookingFormData.lastName,
          email:     bookingFormData.email,
          phone:     bookingFormData.phone,
          service:   bookingFormData.service,
          date:      bookingFormData.date,
          time:      bookingFormData.time,
          notes:     bookingFormData.notes || '',
        },
      })
    });
    const { clientSecret, error: serverError } = await res.json();
    if (serverError) throw new Error(serverError);

    const { paymentIntent, error } = await _stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: _stripeCard,
        billing_details: {
          name:  bookingFormData.firstName + ' ' + bookingFormData.lastName,
          email: bookingFormData.email,
          phone: bookingFormData.phone
        }
      }
    });
    btn.disabled = false;
    btn.textContent = 'Pay £' + amount + ' Deposit';
    if (error) {
      document.getElementById('stripe-card-errors').textContent = error.message;
    } else if (paymentIntent.status === 'succeeded') {
      _onPaymentSuccess('Card', paymentIntent.id);
    }
  } catch(err) {
    btn.disabled = false;
    btn.textContent = 'Pay £' + amount + ' Deposit';
    document.getElementById('stripe-card-errors').textContent = 'Payment failed. Please try again.';
    console.error('Payment error:', err);
  }
}

function processWechatPayment() {
  const btn = document.getElementById('payWechatBtn');
  const amount = _effectiveDeposit();
  btn.disabled = true; btn.textContent = 'Confirming…';
  setTimeout(() => {
    btn.disabled = false; btn.textContent = "I've Completed Payment ✓";
    _onPaymentSuccess(amount === 0 ? 'Promo Code — ' + _appliedPromoCode : 'WeChat Pay');
  }, 1600);
}

function _saveBooking(data) {
  const svc = getServices().find(s => s.name === data.service);
  const durationMins = parseDurationMins(svc ? svc.duration : '60 min');
  const bookings = getBookings();
  bookings.push({
    id: 'b' + Date.now(),
    date: data.date, time: data.time, serviceName: data.service, durationMins,
    firstName: data.firstName, lastName: data.lastName,
    email: data.email, phone: data.phone, notes: data.notes || '',
    paymentMethod: data.paymentMethod, paymentId: data.paymentId || '',
    timestamp: Date.now()
  });
  saveBookings(bookings);
}

function _onPaymentSuccess(method, paymentId) {
  // Re-verify slot is still available to prevent double bookings
  const _svc = getServices().find(s => s.name === bookingFormData.service);
  const _dur = parseDurationMins(_svc ? _svc.duration : '60 min');
  const _stillFree = getAvailableSlotsForDate(bookingFormData.date, _dur);
  if (!_stillFree.includes(bookingFormData.time)) {
    alert('Sorry — this time slot was just taken by another booking. Please go back and choose a different time.');
    backToBookingDetails();
    updateTimeSlots();
    return;
  }
  const data = { ...bookingFormData, paymentMethod: method, paymentId: paymentId || 'N/A' };
  _saveBooking(data);
  _sendConfirmationEmails(data);

  const paid = _effectiveDeposit();
  const msg = paid === 0
    ? `Thank you, ${data.firstName}! Your appointment is confirmed — no deposit was required with your promo code. A confirmation email has been sent to ${data.email}.`
    : `Thank you, ${data.firstName}! Your £${paid} deposit has been received and your appointment is confirmed. A confirmation email has been sent to ${data.email}.`;
  document.getElementById('bookingSuccessMsg').textContent = msg;
  _showCalendarButtons(data);

  document.getElementById('bookingWrap').style.display    = 'none';
  document.getElementById('bookingSteps').style.display   = 'none';
  document.getElementById('bookingPayment').style.display = 'none';
  document.getElementById('bookingSuccess').style.display = 'block';
  window.scrollTo({ top: document.getElementById('booking').offsetTop - 80, behavior:'smooth' });
}

// Derive the backend base URL from the configured payment endpoint.
// e.g. "https://my-server.com/create-payment-intent" → "https://my-server.com"
function _backendBase() {
  const ep = _cfg().paymentEndpoint;
  if (!ep) return '';
  try { return new URL(ep).origin; } catch { return ''; }
}

function _sendConfirmationEmails(data) {
  const cfg  = _cfg();
  const base = _backendBase();

  // ── Prefer backend /send-confirmation when configured ──────────────────────
  if (base) {
    const payload = {
      firstName:     data.firstName,
      lastName:      data.lastName,
      email:         data.email,
      phone:         data.phone,
      service:       data.service,
      date:          data.date,
      time:          data.time,
      notes:         data.notes || '',
      paymentMethod: data.paymentMethod,
      paymentId:     data.paymentId || '',
      depositAmount: '£' + _effectiveDeposit(),
    };
    fetch(base + '/send-confirmation', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    }).catch(e => console.error('Backend /send-confirmation:', e));
    return;
  }

  // ── Fallback: EmailJS (client-side) ────────────────────────────────────────
  if (!cfg.emailjsPublicKey || !cfg.emailjsServiceId) return;
  function _doSend() {
    const params = {
      client_name:    data.firstName + ' ' + data.lastName,
      to_name:        data.firstName,
      to_email:       data.email,
      service:        data.service,
      booking_date:   _fmtDate(data.date),
      booking_time:   data.time,
      deposit_amount: '£' + cfg.depositAmount,
      payment_method: data.paymentMethod,
      notes:          data.notes || 'None',
      phone:          data.phone,
    };
    if (cfg.emailjsClientTpl)
      emailjs.send(cfg.emailjsServiceId, cfg.emailjsClientTpl, params, cfg.emailjsPublicKey)
        .catch(e => console.error('EmailJS client:', e));
    if (cfg.emailjsBizTpl) {
      const bizParams = { ...params, to_email: cfg.businessEmail || data.email, to_name: 'Puppy Beauty Bar' };
      emailjs.send(cfg.emailjsServiceId, cfg.emailjsBizTpl, bizParams, cfg.emailjsPublicKey)
        .catch(e => console.error('EmailJS business:', e));
    }
  }
  if (typeof emailjs !== 'undefined') { _doSend(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  s.onload = _doSend;
  document.head.appendChild(s);
}

// ===== PROMO CODE =====
function applyPromoCode() {
  const code = (document.getElementById('promoInput').value || '').trim().toUpperCase();
  const cfg  = _cfg();
  const msgEl = document.getElementById('promoMsg');
  if (!code) {
    _promoDiscount = 0; _appliedPromoCode = '';
    msgEl.textContent = ''; msgEl.className = 'promo-msg';
    _updatePayAmounts(); return;
  }
  const match = cfg.promoCodes.find(p => p.code === code);
  if (!match) {
    _promoDiscount = 0; _appliedPromoCode = '';
    msgEl.textContent = 'Code not recognised.'; msgEl.className = 'promo-msg error';
    _updatePayAmounts(); return;
  }
  _promoDiscount = Math.min(match.amount, cfg.depositAmount);
  _appliedPromoCode = code;
  const newAmt = _effectiveDeposit();
  msgEl.className = 'promo-msg success';
  msgEl.textContent = newAmt === 0
    ? `✓ Code applied — deposit waived!`
    : `✓ Code applied — £${_promoDiscount.toFixed(2)} off! New deposit: £${newAmt.toFixed(2)}`;
  _updatePayAmounts();
}

function _updatePayAmounts() {
  const amount = _effectiveDeposit();
  const label  = amount === 0 ? 'Complete Booking (Free)' : 'Pay £' + amount + ' Deposit';
  const displayEl = document.getElementById('payDepositDisplay');
  if (displayEl) displayEl.textContent = '£' + amount;
  const cardBtn = document.getElementById('payCardBtn');
  if (cardBtn) { cardBtn.textContent = label; }
}

// ===== GIFT VOUCHER =====
function renderGiftVoucherCard() {
  const el = document.getElementById('giftVoucherCallout');
  if (!el) return;
  const email = _cfg().businessEmail || getContactInfo().email || '';
  const href  = email
    ? 'mailto:' + email + '?subject=' + encodeURIComponent('Gift Voucher Enquiry') +
      '&body=' + encodeURIComponent("Hi,\n\nI'd love to purchase a gift voucher for Puppy Beauty Bar.\n\nPlease let me know the available amounts and how to order.\n\nThank you!")
    : '#booking';
  el.innerHTML = `<div class="gift-voucher-inner">
    <div class="gift-voucher-text">
      <p class="section-tag">Thoughtful Gifting</p>
      <h3>Give the Gift of Beautiful Lashes</h3>
      <p>Gift vouchers are available for all treatments — perfect for birthdays, anniversaries, or just because.</p>
    </div>
    <a href="${href}" class="btn-primary">Enquire About Gift Vouchers</a>
  </div>`;
}

// ===== CALENDAR LINKS =====
function _slotToMins(slot) {
  const m = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10), min = parseInt(m[2], 10);
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}
function _toDTStr(dateStr, slotStr, offsetMins) {
  const base = _slotToMins(slotStr) + (offsetMins || 0);
  const h = Math.floor(base / 60) % 24, m = base % 60;
  return dateStr.replace(/-/g, '') + 'T' + String(h).padStart(2,'0') + String(m).padStart(2,'0') + '00';
}
function _genCalLinks(data) {
  const svc = getServices().find(s => s.name === data.service);
  const dur  = parseDurationMins(svc ? svc.duration : '60 min');
  const start = _toDTStr(data.date, data.time, 0);
  const end   = _toDTStr(data.date, data.time, dur);
  const title = encodeURIComponent('Lash Appointment – ' + data.service);
  const loc   = encodeURIComponent(getContactInfo().address || 'Puppy Beauty Bar');
  const gcUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${loc}`;
  const icsLines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PuppyBeautyBar//EN',
    'BEGIN:VEVENT',
    'DTSTART:' + start,
    'DTEND:'   + end,
    'SUMMARY:Lash Appointment – ' + data.service,
    'LOCATION:' + decodeURIComponent(loc),
    'DESCRIPTION:Booked at Puppy Beauty Bar\\nContact: ' + (getContactInfo().phone || ''),
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const icsUrl = URL.createObjectURL(new Blob([icsLines], { type: 'text/calendar' }));
  return { gcUrl, icsUrl };
}
function _showCalendarButtons(data) {
  const wrap = document.getElementById('calBtns');
  if (!wrap) return;
  const links = _genCalLinks(data);
  wrap.innerHTML =
    `<a href="${links.gcUrl}" target="_blank" rel="noopener" class="cal-btn">📅 Google Calendar</a>` +
    `<a href="${links.icsUrl}" download="appointment.ics" class="cal-btn">📆 Apple / Outlook</a>`;
  wrap.style.display = 'flex';
}

// ===== PATCH TESTS =====
function getPatchTests() {
  try { const s = localStorage.getItem('ppb_patch_tests'); return s ? JSON.parse(s) : []; }
  catch { return []; }
}
function savePatchTests(d) { safeStore('ppb_patch_tests', JSON.stringify(d)); }

function submitPatchTest(e) {
  e.preventDefault();
  const name  = document.getElementById('ptName').value.trim();
  const phone = document.getElementById('ptPhone').value.trim();
  const email = document.getElementById('ptEmail').value.trim();
  const date  = document.getElementById('ptDate').value;
  const notes = document.getElementById('ptNotes').value.trim();
  if (!name || !email || !date) { alert('Please fill in name, email and preferred date.'); return; }
  const tests = getPatchTests();
  tests.push({ id:'pt'+Date.now(), name, phone, email, date, notes, timestamp: Date.now() });
  savePatchTests(tests);
  document.getElementById('patchTestForm').style.display  = 'none';
  document.getElementById('patchTestSuccess').style.display = 'block';
}
function resetPatchTestForm() {
  document.getElementById('patchTestForm').reset();
  document.getElementById('patchTestForm').style.display  = '';
  document.getElementById('patchTestSuccess').style.display = 'none';
}

// ===== CSV EXPORT =====
function adminExportCSV() {
  const bookings = getBookings().sort((a,b) => a.date < b.date ? -1 : 1);
  const BOM = '﻿';
  const header = ['Date','Time','Service','Duration(min)','First Name','Last Name','Phone','Email','Payment','Notes','ID'];
  const rows = bookings.map(b => [
    b.date, b.time, b.serviceName, b.durationMins,
    b.firstName, b.lastName, b.phone||'', b.email||'',
    b.paymentMethod, (b.notes||'').replace(/,/g,'|'), b.id
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv = BOM + header.join(',') + '\n' + rows.join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'ppb_bookings_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

// ===== BOOKING REMINDER =====
function adminSendReminder(id) {
  const b = getBookings().find(x => x.id === id);
  if (!b) return;
  const cfg = _cfg();
  if (!cfg.emailjsPublicKey || !cfg.emailjsServiceId || !cfg.reminderTpl) {
    alert('Configure EmailJS settings and set a Reminder Template ID in Admin → Settings.');
    return;
  }
  function _doSend() {
    emailjs.send(cfg.emailjsServiceId, cfg.reminderTpl, {
      to_email: b.email, to_name: b.firstName,
      client_name: b.firstName + ' ' + b.lastName,
      service: b.serviceName,
      booking_date: _fmtDate(b.date),
      booking_time: b.time,
      phone: b.phone || ''
    }, cfg.emailjsPublicKey)
      .then(() => alert('Reminder sent to ' + b.email + '.'))
      .catch(err => { console.error(err); alert('Failed to send. Check EmailJS config.'); });
  }
  if (typeof emailjs !== 'undefined') { _doSend(); return; }
  const sc = document.createElement('script');
  sc.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  sc.onload = _doSend;
  document.head.appendChild(sc);
}

function resetForm() {
  const cfg = _cfg();
  document.getElementById('bookingForm').reset();
  document.getElementById('bookingForm').style.display    = '';
  document.getElementById('bookingPayment').style.display = 'none';
  document.getElementById('bookingSuccess').style.display = 'none';
  document.getElementById('bookingWrap').style.display    = '';
  document.getElementById('bookingSteps').style.display   = '';
  document.getElementById('bStep1Ind').classList.add('active');
  document.getElementById('bStep2Ind').classList.remove('active');
  bookingStep = 1; bookingFormData = {};
  _promoDiscount = 0; _appliedPromoCode = '';
  if (_stripeCard) _stripeCard.clear();
  const errEl = document.getElementById('stripe-card-errors');
  if (errEl) errEl.textContent = '';
  const cardBtn = document.getElementById('payCardBtn');
  if (cardBtn) { cardBtn.disabled = false; cardBtn.textContent = 'Pay £' + cfg.depositAmount + ' Deposit'; }
  const promoInput = document.getElementById('promoInput');
  if (promoInput) promoInput.value = '';
  const promoMsg = document.getElementById('promoMsg');
  if (promoMsg) { promoMsg.textContent = ''; promoMsg.className = 'promo-msg'; }
  const wcBtn = document.getElementById('payWechatBtn');
  if (wcBtn) { wcBtn.disabled = false; wcBtn.textContent = "I've Completed Payment ✓"; }
  updateTimeSlots();
}

// ===== SERVICES DATA =====
const DEFAULT_SERVICES = [
  { id:'s1', emoji:'✨', name:'Classic Lash Extensions',  desc:'A single extension on each natural lash for a timeless, polished look — perfect for everyday wear.',              price:'From £45', duration:'90–120 min',  status:'active' },
  { id:'s2', emoji:'💫', name:'Volume Lash Extensions',   desc:'Multiple ultra-fine extensions fanned onto each lash for a full, dramatic, and glamorous finish.',                price:'From £65', duration:'120–150 min', status:'active' },
  { id:'s3', emoji:'🌸', name:'Hybrid Lash Extensions',   desc:'The perfect blend of classic and volume — natural yet lush, ideal for those wanting a bit of both.',              price:'From £55', duration:'100–130 min', status:'active' },
  { id:'s4', emoji:'🪄', name:'Lash Lift & Tint',         desc:'Curl, lift, and tint your natural lashes for a wide-awake, mascara-free look lasting up to 8 weeks.',            price:'From £40', duration:'60–75 min',   status:'active' },
  { id:'s5', emoji:'🔁', name:'Lash Infills',             desc:'Maintain your set with a top-up every 2–3 weeks to keep your extensions looking fresh and full.',                 price:'From £30', duration:'45–75 min',   status:'active' },
  { id:'s6', emoji:'💅', name:'Gel Nails',                desc:'Long-lasting gel polish for a glossy, chip-free finish in a wide range of colours.',                              price:'From £30', duration:'45–60 min',   status:'coming-soon' },
  { id:'s7', emoji:'🎨', name:'Nail Art',                 desc:'Creative, bespoke nail art designs — from minimal to maximalist, fully personalised.',                            price:'From £40', duration:'60–90 min',   status:'coming-soon' },
  { id:'s8', emoji:'💎', name:'Acrylic Extensions',       desc:'Durable acrylic extensions shaped and finished to your preferred length and style.',                              price:'From £45', duration:'75–90 min',   status:'coming-soon' },
  { id:'s9', emoji:'🌷', name:'Classic Manicure',         desc:'A relaxing manicure including shaping, cuticle care, and your choice of polish colour.',                         price:'From £20', duration:'30–45 min',   status:'coming-soon' },
];

function getServices() {
  try { const s = localStorage.getItem('ppb_services'); return s ? JSON.parse(s) : DEFAULT_SERVICES.map(x=>({...x})); }
  catch(e) { return DEFAULT_SERVICES.map(x=>({...x})); }
}
function saveServices(s) { safeStore('ppb_services', JSON.stringify(s)); }

function renderServicesOnPage() {
  const services = getServices();
  const active = services.filter(s => s.status === 'active');
  const coming = services.filter(s => s.status === 'coming-soon');

  const grid = document.getElementById('servicesGrid');
  if (grid) {
    grid.innerHTML = active.map(s => `
      <div class="service-card">
        <div class="svc-icon"><span>${esc(s.emoji)}</span></div>
        <div class="svc-body"><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>
        <div class="svc-footer">
          <span class="svc-price">${esc(s.price)}</span>
          <a href="#booking" class="svc-link">Book</a>
        </div>
      </div>`).join('');
  }

  const comingGrid = document.getElementById('comingSoonGrid');
  if (comingGrid) {
    comingGrid.innerHTML = coming.map(s => `
      <div class="service-card svc-coming">
        <span class="svc-soon-badge">Coming Soon</span>
        <div class="svc-icon svc-icon-muted"><span>${esc(s.emoji)}</span></div>
        <div class="svc-body"><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>
        <div class="svc-footer"><span class="svc-price">${esc(s.price)}</span></div>
      </div>`).join('');
  }

  const csSection = document.getElementById('comingSoonSection');
  if (csSection) csSection.style.display = coming.length > 0 ? '' : 'none';

  document.querySelectorAll('#servicesGrid .service-card, #comingSoonGrid .service-card').forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    el.dataset.delay = (i % 4) * 80;
    revealObserver.observe(el);
  });
}

function renderBookingServiceDropdown() {
  const active = getServices().filter(s => s.status === 'active');
  const sel = document.getElementById('bookingServiceSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select a Service —</option>' +
    active.map(s => `<option value="${esc(s.name)}">${esc(s.name)} — ${esc(s.price)}</option>`).join('');

  // Also populate the feedback form service picker
  const fbSel = document.getElementById('fbService');
  if (fbSel) {
    fbSel.innerHTML = '<option value="">— Select —</option>' +
      active.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');
  }
}

// ===== TESTIMONIALS =====
const DEFAULT_TESTIMONIALS = [
  { name:'Emma R.',   service:'Classic Extensions', rating:5, comment:"My classic set looks absolutely stunning — so natural yet so impactful. They lasted over 4 weeks and I barely lost any! Best lash studio I've been to.", featured:false },
  { name:'Sophie K.', service:'Hybrid Extensions',  rating:5, comment:"I got a hybrid set and I'm absolutely obsessed. They're so full and fluffy yet still look natural. My friends keep asking if they're my real lashes!", featured:true  },
  { name:'Priya M.',  service:'Lash Lift & Tint',   rating:5, comment:"The lash lift has completely transformed my morning routine. I wake up looking like I've already done my makeup. Incredible results — will never go back!", featured:false },
];

function getPublishedTestimonials() {
  try { const s = localStorage.getItem('ppb_testimonials'); return s ? JSON.parse(s) : null; }
  catch(e) { return null; }
}
function savePublishedTestimonials(t) { safeStore('ppb_testimonials', JSON.stringify(t)); }

function renderTestimonials() {
  const stored = getPublishedTestimonials();
  const items  = (stored && stored.length > 0) ? stored : DEFAULT_TESTIMONIALS;
  const grid   = document.querySelector('.testimonials-grid');
  if (!grid) return;

  grid.innerHTML = items.map(t => {
    const init  = t.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const stars = '★'.repeat(t.rating||5) + '☆'.repeat(5-(t.rating||5));
    return `<div class="testimonial-card${t.featured?' featured':''}">
      <div class="t-quote${t.featured?' featured-quote':''}">"</div>
      <div class="stars">${stars}</div>
      <p>${esc(t.comment)}</p>
      <div class="client-info">
        <div class="client-avatar">${init}</div>
        <div><strong>${esc(t.name)}</strong><span>${esc(t.service)}</span></div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.testimonial-card').forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    el.dataset.delay = (i % 4) * 80;
    revealObserver.observe(el);
  });
}

// ===== FEEDBACK FORM =====
let fbPhotoData = null;
let fbRatingVal = 0;

function setFeedbackRating(val) {
  fbRatingVal = val;
  document.querySelectorAll('.star-btn').forEach((b, i) => b.classList.toggle('active', i < val));
}

function handleFeedbackPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  compressImage(file, 800, 0.72, dataUrl => {
    fbPhotoData = dataUrl;
    document.getElementById('fbPhotoImg').src = dataUrl;
    document.getElementById('fbPhotoPreview').style.display = '';
    document.getElementById('fbPhotoArea').style.display    = 'none';
  });
}

function clearFeedbackPhoto() {
  fbPhotoData = null;
  document.getElementById('fbPhoto').value = '';
  document.getElementById('fbPhotoPreview').style.display = 'none';
  document.getElementById('fbPhotoArea').style.display    = '';
}

function submitFeedback(e) {
  e.preventDefault();
  const name    = document.getElementById('fbName').value.trim();
  const service = document.getElementById('fbService').value;
  const comment = document.getElementById('fbComment').value.trim();
  if (!name || !service || !comment) { alert('Please complete all required fields.'); return; }
  if (!fbRatingVal)                  { alert('Please select a star rating.'); return; }

  const pending = getPendingReviews();
  pending.push({
    id: 'r' + Date.now(), name, service, rating: fbRatingVal, comment,
    photo: fbPhotoData || null,
    date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }),
    timestamp: Date.now()
  });
  if (!safeStore('ppb_feedback_pending', JSON.stringify(pending))) return;

  document.getElementById('feedbackForm').style.display    = 'none';
  document.getElementById('feedbackSuccess').style.display = 'block';
}

function resetFeedbackForm() {
  document.getElementById('feedbackForm').reset();
  fbPhotoData = null; fbRatingVal = 0;
  document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('active'));
  clearFeedbackPhoto();
  document.getElementById('feedbackForm').style.display    = '';
  document.getElementById('feedbackSuccess').style.display = 'none';
}

// ===== PENDING REVIEWS =====
function getPendingReviews() {
  try { const s = localStorage.getItem('ppb_feedback_pending'); return s ? JSON.parse(s) : []; }
  catch(e) { return []; }
}



// ===== BACK TO TOP =====
function scrollToTop() { window.scrollTo({ top:0, behavior:'smooth' }); }

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }, entry.target.dataset.delay || 0);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.acc-item').forEach((el, i) => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(22px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  el.dataset.delay = (i % 4) * 80;
  revealObserver.observe(el);
});

// ===== INITIAL RENDER (must follow revealObserver definition) =====
renderServicesOnPage();
renderBookingServiceDropdown();
renderTestimonials();
renderGallery();
renderProductGrid();
renderGiftVoucherCard();
renderMembershipPlans();
renderMembershipEvents();
renderContactInfo();
renderCustomTermsClause();

// Persist the configured admin credentials so the Admin login matches the requested defaults
try { saveAdminCredentials({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }); } catch(e) { /* ignore */ }

// ===== STRIP DUPLICATE =====
const strip = document.querySelector('.strip-inner');
if (strip) strip.innerHTML += strip.innerHTML;

// ═══════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════

function getProducts() {
  try { const s = localStorage.getItem('ppb_products'); return s ? JSON.parse(s) : DEFAULT_PRODUCTS.map(x=>({...x})); }
  catch(e) { return DEFAULT_PRODUCTS.map(x=>({...x})); }
}
function saveProducts(p) { safeStore('ppb_products', JSON.stringify(p)); }

function renderProductGrid() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const products = getProducts().filter(p => !p.hidden);
  if (products.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--mid);padding:32px 0">No products available yet.</p>';
    return;
  }
  grid.innerHTML = products.map(p => {
    const isGoldBadge = p.badge === 'New' || p.badge === 'Gift';
    return `<div class="product-card">
      ${p.badge ? `<span class="product-badge${isGoldBadge?' badge-gold':''}">${esc(p.badge)}</span>` : ''}
      <div class="product-img"><span style="font-size:3rem">${esc(p.emoji)}</span></div>
      <div class="product-body">
        <span class="product-cat">${esc(p.cat)}</span>
        <div class="product-name">${esc(p.name)}</div>
        <div class="product-desc">${esc(p.desc)}</div>
      </div>
      <div class="product-footer">
        <span class="product-price">${esc(p.price)}</span>
        <button class="product-btn" onclick="enquireProduct('${p.id}')">Enquire</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.product-card').forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    el.dataset.delay = (i % 4) * 80;
    revealObserver.observe(el);
  });
}

function enquireProduct(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  const bizEmail = _cfg().businessEmail || getContactInfo().email || 'hello@puppybeautybar.co.uk';
  const subject = encodeURIComponent('Product Enquiry: ' + p.name);
  const body    = encodeURIComponent('Hi,\n\nI\'m interested in purchasing: ' + p.name + ' (' + p.price + ').\n\nPlease let me know more about availability.\n\nThank you!');
  window.location.href = 'mailto:' + bizEmail + '?subject=' + subject + '&body=' + body;
}

// ===== CONTACT INFO =====
function getMembershipData() {
  try { const s = localStorage.getItem('ppb_membership'); return s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_MEMBERSHIP_DATA)); }
  catch { return JSON.parse(JSON.stringify(DEFAULT_MEMBERSHIP_DATA)); }
}
function saveMembershipData(d) { safeStore('ppb_membership', JSON.stringify(d)); }

// Members (granted via admin after first attended booking)
function getMembers() { try { const s = localStorage.getItem('ppb_members'); return s ? JSON.parse(s) : []; } catch { return []; } }
function saveMembers(m) { safeStore('ppb_members', JSON.stringify(m)); }
function isMember(email) { if (!email) return false; return getMembers().some(m => (m.email||'').toLowerCase() === email.toLowerCase()); }

function getContactInfo() {
  try { const s = localStorage.getItem('ppb_contact'); return s ? { ...DEFAULT_CONTACT_INFO, ...JSON.parse(s) } : { ...DEFAULT_CONTACT_INFO }; }
  catch { return { ...DEFAULT_CONTACT_INFO }; }
}
function saveContactInfo(c) { safeStore('ppb_contact', JSON.stringify(c)); }

function renderContactInfo() {
  const c = getContactInfo();
  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const setHref = (id, url) => { const el = document.getElementById(id); if (el) el.href = url || '#'; };
  setTxt('infoPhone',   c.phone   || '[Your Phone Number]');
  setTxt('infoEmail',   c.email   || '[Your Email Address]');
  setTxt('infoAddress', c.address ? c.address + (c.city ? ', ' + c.city : '') : '[Your Salon Address]');
  setTxt('infoHours',   c.hours   || 'Mon–Sun: 10:00 AM – 5:00 PM');
  setTxt('footerPhone', c.phone   || '[Your Phone Number]');
  setTxt('footerEmail', c.email   || '[Your Email Address]');
  setTxt('footerAddress', c.address ? c.address + (c.city ? ', ' + c.city : '') : '[Your Salon Address]');
  setTxt('footerHours', c.hours   || 'Mon–Sun: 10:00 AM – 5:00 PM');
  setHref('socialInstagram', c.instagram); setHref('footerInstagram', c.instagram);
  setHref('socialFacebook',  c.facebook);  setHref('footerFacebook',  c.facebook);
  setHref('socialTikTok',    c.tiktok);    setHref('footerTikTok',    c.tiktok);
  // WhatsApp float
  const waBtn = document.getElementById('whatsappFloat');
  if (waBtn) {
    const phone = (c.whatsapp || c.phone).replace(/\D/g, '');
    waBtn.href = phone ? 'https://wa.me/' + phone : '#';
    waBtn.style.display = phone ? '' : 'none';
  }
  // Map embed
  const mapFrame = document.getElementById('contactMapFrame');
  if (mapFrame && c.mapsUrl) mapFrame.src = c.mapsUrl;
  const mapWrap = document.getElementById('contactMapWrap');
  if (mapWrap) mapWrap.style.display = c.mapsUrl ? '' : 'none';

  // QR codes (public display area, optional)
  const qrWrap = document.getElementById('contactQrWrap');
  if (qrWrap) {
    qrWrap.innerHTML = '';
    if (c.wechatQr) qrWrap.innerHTML += `<div class="qr-item"><img src="${c.wechatQr}" alt="WeChat QR" data-label="WeChat" class="contact-qr-img" style="width:110px;height:110px;border-radius:8px;object-fit:cover"></div>`;
    if (c.whatsappQr) qrWrap.innerHTML += `<div class="qr-item"><img src="${c.whatsappQr}" alt="WhatsApp QR" data-label="WhatsApp" class="contact-qr-img" style="width:110px;height:110px;border-radius:8px;object-fit:cover"></div>`;
    if (c.instagramQr) qrWrap.innerHTML += `<div class="qr-item"><img src="${c.instagramQr}" alt="Instagram QR" data-label="Instagram" class="contact-qr-img" style="width:110px;height:110px;border-radius:8px;object-fit:cover"></div>`;
    qrWrap.style.display = qrWrap.innerHTML ? '' : 'none';
    // attach click handlers to open modal
    qrWrap.querySelectorAll('.contact-qr-img').forEach(img => {
      img.addEventListener('click', () => showQrModal(img.src, img.dataset.label || img.alt));
    });
  }

  const footerQr = document.getElementById('footerQrWrap');
  if (footerQr) {
    footerQr.innerHTML = '';
    if (c.instagramQr) footerQr.innerHTML += `<img src="${c.instagramQr}" alt="Instagram QR" data-label="Instagram" class="contact-qr-img" style="width:66px;height:66px;margin-right:8px;border-radius:8px;object-fit:cover">`;
    if (c.wechatQr)     footerQr.innerHTML += `<img src="${c.wechatQr}" alt="WeChat QR" data-label="WeChat" class="contact-qr-img" style="width:66px;height:66px;margin-right:8px;border-radius:8px;object-fit:cover">`;
    if (c.whatsappQr)  footerQr.innerHTML += `<img src="${c.whatsappQr}" alt="WhatsApp QR" data-label="WhatsApp" class="contact-qr-img" style="width:66px;height:66px;border-radius:8px;object-fit:cover">`;
    footerQr.querySelectorAll('.contact-qr-img').forEach(img => {
      img.addEventListener('click', () => showQrModal(img.src, img.dataset.label || img.alt));
    });
  }
}

function renderCustomTermsClause() {
  const txt = _cfg().customTermsAllergy || '';
  document.querySelectorAll('#tcAllergyClause').forEach(el => {
    el.innerHTML = txt ? `<div style="margin-top:8px;color:var(--mid);">${txt}</div>` : '';
  });
}

// ===== MEMBERSHIP PUBLIC RENDER =====
function renderMembershipPlans() {
  const data = getMembershipData();
  const grid = document.getElementById('membershipGrid');
  if (!grid) return;
  grid.innerHTML = data.tiers.map(p => `
    <div class="membership-card${p.featured ? ' membership-card-featured' : ''}">
      ${p.featured ? '<span class="membership-featured-badge">Most Popular</span>' : ''}
      <div class="membership-discount-pill">${p.discount}% off all services</div>
      <div class="membership-name">${esc(p.name)}</div>
      <div class="membership-tagline">${esc(p.tagline)}</div>
      <div class="membership-price">${p.price === 'TBC' ? 'Pricing TBC' : '£' + esc(String(p.price)) + ' / mo'}</div>
      <ul class="membership-perks">${p.perks.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
      <a href="mailto:${_cfg().businessEmail || getContactInfo().email || 'hello@puppybeautybar.co.uk'}?subject=${encodeURIComponent('Membership Enquiry — ' + p.name)}" class="btn-outline membership-enquire-btn">Register Interest</a>
    </div>`).join('');
}

function renderMembershipEvents() {
  const data = getMembershipData();
  const section = document.getElementById('membershipEvents');
  if (!section) return;
  if (!data.events || !data.events.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  section.innerHTML = `
    <div class="membership-events-head"><p class="section-tag">What's On</p><h3>Upcoming Member Events</h3></div>
    <div class="events-grid">${data.events.map(ev => {
      let day = '', mon = '';
      if (ev.date) { const d = new Date(ev.date + 'T00:00:00'); day = d.getDate(); mon = d.toLocaleDateString('en-GB',{month:'short'}); }
      return `<div class="event-card">
        ${day ? `<div class="event-date-badge"><div class="event-day">${day}</div><div class="event-month">${mon}</div></div>` : ''}
        <div class="event-info">
          <div class="event-title">${esc(ev.title)}</div>
          ${ev.time||ev.location ? `<div class="event-meta">${[ev.time,ev.location].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
          ${ev.desc ? `<div class="event-desc">${esc(ev.desc)}</div>` : ''}
        </div>
      </div>`;
    }).join('')}</div>`;
}

// ===== ADMIN PANEL =====
function openAdmin() {
  document.getElementById('adminOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  document.getElementById('adminError').style.display = 'none';
}
function closeAdmin() {
  document.getElementById('adminOverlay').style.display = 'none';
  document.body.style.overflow = '';
}
function adminLogin() {
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  const creds = getAdminCredentials();
  if (u === creds.username && p === creds.password) {
    document.getElementById('adminLoginPanel').style.display = 'none';
    document.getElementById('adminDashboard').style.display = '';
    document.getElementById('adminReviewBadge').textContent = getPendingReviews().length;
    document.getElementById('adminBookingBadge').textContent =
      getBookings().filter(b => b.date >= new Date().toISOString().split('T')[0]).length;
    switchAdminTab(_adminTab);
  } else {
    document.getElementById('adminError').style.display = 'block';
    document.getElementById('adminPass').value = '';
    document.getElementById('adminPass').focus();
  }
}
function adminLogout() {
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminLoginPanel').style.display = '';
}

function switchAdminTab(tab) {
  _adminTab = tab;
  ['availability','bookings','services','membership','products','reviews','photos','contact','settings'].forEach(t => {
    const btn  = document.getElementById('adminTab_' + t);
    const body = document.getElementById('adminTabBody_' + t);
    if (btn)  btn.classList.toggle('active', t === tab);
    if (body) body.style.display = t === tab ? '' : 'none';
  });
  switch (tab) {
    case 'availability': _tabAvailability(); break;
    case 'bookings':     _tabBookings();     break;
    case 'services':     _tabServices();     break;
    case 'membership':   _tabMembership();   break;
    case 'products':     _tabProducts();     break;
    case 'reviews':      _tabReviews();      break;
    case 'photos':       _tabPhotos();       break;
    case 'contact':      _tabContact();      break;
    case 'settings':     _tabSettings();     break;
  }
}

// ─── AVAILABILITY ───
function _tabAvailability() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  if (!_availDate || !dates.includes(_availDate)) _availDate = dates[0];
  document.getElementById('adminTabBody_availability').innerHTML =
    '<p class="admin-tab-hint">Set available slots for the next 2 weeks. Green = open, grey = disabled, red = booked.</p>' +
    `<div class="avail-date-row">${dates.map(d => {
      const dt = new Date(d + 'T00:00:00');
      return `<button class="avail-date-btn${d === _availDate ? ' active' : ''}" data-date="${d}" onclick="switchAvailDate('${d}')">
        <span class="avail-date-day">${dt.toLocaleDateString('en-GB',{weekday:'short'})}</span>
        <span class="avail-date-num">${dt.getDate()}</span>
        ${d === todayStr ? '<span class="avail-today-badge">Today</span>' : ''}
      </button>`;
    }).join('')}</div>` +
    '<div id="availDayContent"></div>';
  renderAvailDay(_availDate);
}

function switchAvailDate(date) {
  _availDate = date;
  document.querySelectorAll('.avail-date-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.date === date);
  });
  renderAvailDay(date);
}

function renderAvailDay(date) {
  const avail = getAvailableSlots();
  const adminSlots = avail.hasOwnProperty(date) ? avail[date] : [];
  const bookings = getBookings().filter(b => b.date === date);
  const slotBooking = {};
  bookings.forEach(b => {
    const si = ALL_SLOTS.indexOf(b.time);
    if (si < 0) return;
    const n = Math.ceil(b.durationMins / 15);
    for (let i = si; i < si + n && i < ALL_SLOTS.length; i++) slotBooking[ALL_SLOTS[i]] = b;
  });
  const dt = new Date(date + 'T00:00:00');
  const dayLabel = dt.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
  document.getElementById('availDayContent').innerHTML =
    `<div class="avail-day-head">
      <h4>${dayLabel}</h4>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="admin-btn admin-btn-save"   onclick="adminSetDayAll('${date}',true)">Enable All</button>
        <button class="admin-btn admin-btn-cancel" onclick="adminSetDayAll('${date}',false)">Disable All</button>
      </div>
    </div>
    <div class="admin-slot-grid">${ALL_SLOTS.map(s => {
      const bk = slotBooking[s];
      const on = adminSlots.includes(s);
      const cls = 'admin-slot-btn' + (bk ? ' booked' : on ? ' on' : '');
      return `<button class="${cls}" data-date="${date}" data-slot="${s}"
        ${bk ? `disabled title="${esc(bk.firstName+' '+bk.lastName+' – '+bk.serviceName)}"` : `onclick="adminToggleSlot('${date}','${s}')"`}>${s}</button>`;
    }).join('')}</div>` +
    (!adminSlots.length ? '<p class="admin-tab-hint" style="color:#c04070;font-weight:600;margin-top:8px">⛔ This day is closed — no slots are enabled. Use "Enable All" to open slots.</p>' : '') +
    (bookings.length
      ? `<div class="admin-section-head" style="margin-top:20px"><h4>Bookings &middot; ${bookings.length}</h4></div>` +
        bookings.map(b => `<div class="admin-review-card">
          <div class="admin-review-head">
            <div><strong>${esc(b.firstName)} ${esc(b.lastName)}</strong>
              <span style="color:var(--pink);font-weight:700;margin:0 6px">${esc(b.time)}</span>
              ${esc(b.serviceName)} <span style="color:var(--mid);font-size:.76rem">(${b.durationMins} min)</span>
            </div>
            <button class="admin-btn admin-btn-del" onclick="adminCancelBooking('${b.id}','${date}')">Cancel</button>
          </div>
          <div style="font-size:.8rem;color:var(--mid);margin-top:6px">
            📞 ${esc(b.phone)} &nbsp;&middot;&nbsp; 📧 ${esc(b.email)}${b.notes?`<br>💬 ${esc(b.notes)}`:''}
          </div>
        </div>`).join('')
      : '<p class="admin-tab-hint" style="margin-top:12px">No bookings for this day.</p>');
}

function adminToggleSlot(date, slot) {
  const avail = getAvailableSlots();
  const current = avail.hasOwnProperty(date) ? [...avail[date]] : [];
  const idx = current.indexOf(slot);
  if (idx >= 0) current.splice(idx, 1);
  else {
    const ai = ALL_SLOTS.indexOf(slot);
    let ins = 0;
    while (ins < current.length && ALL_SLOTS.indexOf(current[ins]) < ai) ins++;
    current.splice(ins, 0, slot);
  }
  avail[date] = current;
  saveAvailability(avail);
  const btn = document.querySelector(`.admin-slot-btn[data-date="${date}"][data-slot="${slot}"]`);
  if (btn) btn.classList.toggle('on', current.includes(slot));
}

function adminSetDayAll(date, enable) {
  const avail = getAvailableSlots();
  avail[date] = enable ? [...ALL_SLOTS] : [];
  saveAvailability(avail);
  renderAvailDay(date);
}

function adminCancelBooking(id, date) {
  if (!confirm('Cancel this booking? The slots will be freed.')) return;
  saveBookings(getBookings().filter(b => b.id !== id));
  renderAvailDay(date);
}

// ─── SERVICES ───
function _tabServices() {
  const svcs = getServices();
  const clr = { active:'#2d7a38', 'coming-soon':'#b87a00', hidden:'#9a9696' };
  const lbl = { active:'Active', 'coming-soon':'Coming Soon', hidden:'Hidden' };
  document.getElementById('adminTabBody_services').innerHTML = svcs.map(s => `
    <div class="admin-item">
      <span style="font-size:1.6rem;flex-shrink:0">${esc(s.emoji)}</span>
      <div class="admin-item-info">
        <div class="admin-item-name">${esc(s.name)}</div>
        <div class="admin-item-meta">${esc(s.price)} · ${esc(s.duration)} · <span style="color:${clr[s.status]};font-weight:700">${lbl[s.status]}</span></div>
      </div>
      <div class="admin-item-actions">
        <button class="admin-btn admin-btn-edit" onclick="adminEditSvc('${s.id}')">Edit</button>
        <button class="admin-btn admin-btn-del"  onclick="adminDelSvc('${s.id}')">Delete</button>
      </div>
    </div>
    <div class="admin-edit-form" id="svcf_${s.id}">
      <div class="admin-form-row">
        <div class="form-group"><label>Emoji</label><input id="se_${s.id}_emoji" value="${esc(s.emoji)}"/></div>
        <div class="form-group"><label>Status</label><select id="se_${s.id}_status">
          <option value="active"${s.status==='active'?' selected':''}>Active</option>
          <option value="coming-soon"${s.status==='coming-soon'?' selected':''}>Coming Soon</option>
          <option value="hidden"${s.status==='hidden'?' selected':''}>Hidden</option>
        </select></div>
      </div>
      <div class="form-group" style="margin-top:8px"><label>Name</label><input id="se_${s.id}_name" value="${esc(s.name)}"/></div>
      <div class="form-group" style="margin-top:8px"><label>Description</label><textarea id="se_${s.id}_desc" rows="2">${esc(s.desc||'')}</textarea></div>
      <div class="admin-form-row" style="margin-top:8px">
        <div class="form-group"><label>Price</label><input id="se_${s.id}_price" value="${esc(s.price)}"/></div>
        <div class="form-group"><label>Duration</label><input id="se_${s.id}_dur" value="${esc(s.duration)}"/></div>
      </div>
      <div class="admin-edit-actions">
        <button class="admin-btn admin-btn-save" onclick="adminSaveSvc('${s.id}')">Save</button>
        <button class="admin-btn admin-btn-cancel" onclick="adminEditSvc('${s.id}')">Cancel</button>
      </div>
    </div>`).join('') + `<button class="admin-btn-add" onclick="adminAddSvc()">+ Add Service</button>`;
}
function adminEditSvc(id) { document.getElementById('svcf_' + id).classList.toggle('open'); }
function adminDelSvc(id) {
  if (!confirm('Delete this service?')) return;
  saveServices(getServices().filter(s => s.id !== id));
  renderServicesOnPage(); renderBookingServiceDropdown(); _tabServices();
}
function adminSaveSvc(id) {
  const svcs = getServices(); const s = svcs.find(x => x.id === id); if (!s) return;
  s.emoji = document.getElementById(`se_${id}_emoji`).value.trim() || s.emoji;
  s.name  = document.getElementById(`se_${id}_name`).value.trim()  || s.name;
  s.desc  = document.getElementById(`se_${id}_desc`).value.trim();
  s.price = document.getElementById(`se_${id}_price`).value.trim();
  s.duration = document.getElementById(`se_${id}_dur`).value.trim();
  s.status   = document.getElementById(`se_${id}_status`).value;
  saveServices(svcs); renderServicesOnPage(); renderBookingServiceDropdown(); _tabServices();
}
function adminAddSvc() {
  const body = document.getElementById('adminTabBody_services');
  if (document.getElementById('svcf_NEW')) { document.getElementById('svcf_NEW').classList.toggle('open'); return; }
  const div = document.createElement('div'); div.id = 'svcf_NEW'; div.className = 'admin-edit-form open';
  div.innerHTML = `<div class="admin-form-row">
    <div class="form-group"><label>Emoji</label><input id="se_NEW_emoji" value="✨"/></div>
    <div class="form-group"><label>Status</label><select id="se_NEW_status"><option value="active">Active</option><option value="coming-soon">Coming Soon</option></select></div>
  </div>
  <div class="form-group" style="margin-top:8px"><label>Name</label><input id="se_NEW_name" placeholder="Service name"/></div>
  <div class="form-group" style="margin-top:8px"><label>Description</label><textarea id="se_NEW_desc" rows="2" placeholder="Description..."></textarea></div>
  <div class="admin-form-row" style="margin-top:8px">
    <div class="form-group"><label>Price</label><input id="se_NEW_price" value="From £"/></div>
    <div class="form-group"><label>Duration</label><input id="se_NEW_dur" value="60 min"/></div>
  </div>
  <div class="admin-edit-actions">
    <button class="admin-btn admin-btn-save" onclick="adminSaveNewSvc()">Add</button>
    <button class="admin-btn admin-btn-cancel" onclick="this.closest('.admin-edit-form').remove()">Cancel</button>
  </div>`;
  body.querySelector('.admin-btn-add').before(div);
}
function adminSaveNewSvc() {
  const name = document.getElementById('se_NEW_name').value.trim();
  if (!name) { alert('Enter a service name.'); return; }
  const svcs = getServices();
  svcs.push({ id:'s'+Date.now(), emoji:document.getElementById('se_NEW_emoji').value.trim()||'✨', name,
    desc:document.getElementById('se_NEW_desc').value.trim(), price:document.getElementById('se_NEW_price').value.trim(),
    duration:document.getElementById('se_NEW_dur').value.trim(), status:document.getElementById('se_NEW_status').value });
  saveServices(svcs); renderServicesOnPage(); renderBookingServiceDropdown(); _tabServices();
}

// ─── MEMBERSHIP ───
function _tabMembership() {
  const data = getMembershipData();
  document.getElementById('adminTabBody_membership').innerHTML = `
    <div class="admin-section-head"><h4>Membership Tiers</h4></div>
    ${data.tiers.map(t => `
      <div class="admin-item">
        <div class="admin-item-info">
          <div class="admin-item-name">${esc(t.name)} ${t.featured?'<span class="admin-featured-tag">Featured</span>':''}</div>
          <div class="admin-item-meta">${esc(t.tagline)} · ${t.price==='TBC'?'Pricing TBC':'£'+t.price+'/mo'} · ${t.discount}% off</div>
        </div>
        <div class="admin-item-actions"><button class="admin-btn admin-btn-edit" onclick="adminEditTier('${t.id}')">Edit</button></div>
      </div>
      <div class="admin-edit-form" id="tierf_${t.id}">
        <div class="admin-form-row">
          <div class="form-group"><label>Name</label><input id="te_${t.id}_name" value="${esc(t.name)}"/></div>
          <div class="form-group"><label>Price (or TBC)</label><input id="te_${t.id}_price" value="${esc(t.price)}"/></div>
        </div>
        <div class="admin-form-row" style="margin-top:8px">
          <div class="form-group"><label>Tagline</label><input id="te_${t.id}_tag" value="${esc(t.tagline)}"/></div>
          <div class="form-group"><label>Discount %</label><input type="number" id="te_${t.id}_disc" value="${t.discount}" min="0" max="100"/></div>
        </div>
        <div class="form-group" style="margin-top:8px"><label>Featured?</label><select id="te_${t.id}_feat">
          <option value="1"${t.featured?' selected':''}>Yes</option><option value="0"${!t.featured?' selected':''}>No</option>
        </select></div>
        <div class="form-group" style="margin-top:8px"><label>Perks (one per line)</label>
          <textarea id="te_${t.id}_perks" rows="5">${t.perks.join('\n')}</textarea></div>
        <div class="admin-edit-actions">
          <button class="admin-btn admin-btn-save" onclick="adminSaveTier('${t.id}')">Save</button>
          <button class="admin-btn admin-btn-cancel" onclick="adminEditTier('${t.id}')">Cancel</button>
        </div>
      </div>`).join('')}
    <div class="admin-section-head" style="margin-top:24px"><h4>Events (${data.events.length})</h4></div>
    ${data.events.length ? data.events.map(ev => `
      <div class="admin-item">
        <div class="admin-item-info">
          <div class="admin-item-name">${esc(ev.title)}</div>
          <div class="admin-item-meta">${esc(ev.date)}${ev.time?' · '+esc(ev.time):''}${ev.location?' · '+esc(ev.location):''}</div>
        </div>
        <div class="admin-item-actions"><button class="admin-btn admin-btn-del" onclick="adminDelEvent('${ev.id}')">Delete</button></div>
      </div>`).join('') : '<p class="admin-tab-hint">No events added yet.</p>'}
    <div class="admin-edit-form open" style="margin-top:12px">
      <h4 style="margin-bottom:12px;font-size:.88rem;font-family:Inter,sans-serif;font-weight:700">Add Event</h4>
      <div class="admin-form-row">
        <div class="form-group"><label>Date</label><input type="date" id="ev_date"/></div>
        <div class="form-group"><label>Time</label><input id="ev_time" placeholder="e.g. 6:00 PM"/></div>
      </div>
      <div class="form-group" style="margin-top:8px"><label>Title</label><input id="ev_title" placeholder="Members Evening"/></div>
      <div class="form-group" style="margin-top:8px"><label>Location</label><input id="ev_loc" placeholder="Studio / Online"/></div>
      <div class="form-group" style="margin-top:8px"><label>Description</label><textarea id="ev_desc" rows="2" placeholder="What to expect..."></textarea></div>
      <button class="admin-btn admin-btn-save" style="margin-top:12px" onclick="adminAddEvent()">Add Event</button>
    </div>`;
}
function adminEditTier(id) { document.getElementById('tierf_' + id).classList.toggle('open'); }
function adminSaveTier(id) {
  const data = getMembershipData(); const t = data.tiers.find(x => x.id === id); if (!t) return;
  t.name     = document.getElementById(`te_${id}_name`).value.trim()  || t.name;
  t.tagline  = document.getElementById(`te_${id}_tag`).value.trim();
  t.price    = document.getElementById(`te_${id}_price`).value.trim() || 'TBC';
  t.discount = parseInt(document.getElementById(`te_${id}_disc`).value) || 0;
  t.featured = document.getElementById(`te_${id}_feat`).value === '1';
  t.perks    = document.getElementById(`te_${id}_perks`).value.split('\n').map(x=>x.trim()).filter(Boolean);
  saveMembershipData(data); renderMembershipPlans(); _tabMembership();
}
function adminAddEvent() {
  const date = document.getElementById('ev_date').value;
  const title = document.getElementById('ev_title').value.trim();
  if (!date || !title) { alert('Date and title are required.'); return; }
  const data = getMembershipData();
  data.events.push({ id:'ev'+Date.now(), date, time:document.getElementById('ev_time').value.trim(),
    title, location:document.getElementById('ev_loc').value.trim(), desc:document.getElementById('ev_desc').value.trim() });
  saveMembershipData(data); renderMembershipEvents(); _tabMembership();
}
function adminDelEvent(id) {
  if (!confirm('Delete this event?')) return;
  const data = getMembershipData();
  data.events = data.events.filter(e => e.id !== id);
  saveMembershipData(data); renderMembershipEvents(); _tabMembership();
}

// ─── PRODUCTS ───
function _tabProducts() {
  const prods = getProducts();
  document.getElementById('adminTabBody_products').innerHTML = prods.map(p => `
    <div class="admin-item">
      <span style="font-size:1.6rem;flex-shrink:0">${esc(p.emoji)}</span>
      <div class="admin-item-info">
        <div class="admin-item-name">${esc(p.name)}${p.hidden?' <span style="color:var(--mid);font-size:.78rem">(hidden)</span>':''}</div>
        <div class="admin-item-meta">${esc(p.cat)} · ${esc(p.price)}</div>
        <span class="admin-stock-badge ${p.inStock===false?'out-of-stock':'in-stock'}">${p.inStock===false?'Out of Stock':'In Stock'}</span>
      </div>
      <div class="admin-item-actions">
        <button class="admin-btn admin-btn-toggle${p.inStock===false?'':' active'}" onclick="adminToggleStock('${p.id}')">${p.inStock===false?'Mark In Stock':'Mark Out of Stock'}</button>
        <button class="admin-btn admin-btn-edit" onclick="adminEditProd('${p.id}')">Edit</button>
        <button class="admin-btn admin-btn-del"  onclick="adminDelProd('${p.id}')">Delete</button>
      </div>
    </div>
    <div class="admin-edit-form" id="prodf_${p.id}">
      <div class="admin-form-row">
        <div class="form-group"><label>Emoji</label><input id="pe_${p.id}_emoji" value="${esc(p.emoji)}"/></div>
        <div class="form-group"><label>Category</label><input id="pe_${p.id}_cat" value="${esc(p.cat)}"/></div>
      </div>
      <div class="form-group" style="margin-top:8px"><label>Name</label><input id="pe_${p.id}_name" value="${esc(p.name)}"/></div>
      <div class="form-group" style="margin-top:8px"><label>Description</label><textarea id="pe_${p.id}_desc" rows="2">${esc(p.desc||'')}</textarea></div>
      <div class="admin-form-row" style="margin-top:8px">
        <div class="form-group"><label>Price</label><input id="pe_${p.id}_price" value="${esc(p.price)}"/></div>
        <div class="form-group"><label>Badge</label><input id="pe_${p.id}_badge" value="${esc(p.badge||'')}"/></div>
      </div>
      <div class="form-group" style="margin-top:8px"><label>Visibility</label><select id="pe_${p.id}_hidden">
        <option value="0"${!p.hidden?' selected':''}>Visible</option>
        <option value="1"${p.hidden?' selected':''}>Hidden</option>
      </select></div>
      <div class="admin-edit-actions">
        <button class="admin-btn admin-btn-save" onclick="adminSaveProd('${p.id}')">Save</button>
        <button class="admin-btn admin-btn-cancel" onclick="adminEditProd('${p.id}')">Cancel</button>
      </div>
    </div>`).join('') + `<button class="admin-btn-add" onclick="adminAddProd()">+ Add Product</button>`;
}
function adminEditProd(id) { document.getElementById('prodf_' + id).classList.toggle('open'); }
function adminToggleStock(id) {
  const prods = getProducts(); const p = prods.find(x => x.id === id); if (!p) return;
  p.inStock = p.inStock === false;
  saveProducts(prods); renderProductGrid(); _tabProducts();
}
function adminDelProd(id) {
  if (!confirm('Delete product?')) return;
  saveProducts(getProducts().filter(x => x.id !== id)); renderProductGrid(); _tabProducts();
}
function adminSaveProd(id) {
  const prods = getProducts(); const p = prods.find(x => x.id === id); if (!p) return;
  p.emoji  = document.getElementById(`pe_${id}_emoji`).value.trim()  || p.emoji;
  p.cat    = document.getElementById(`pe_${id}_cat`).value.trim();
  p.name   = document.getElementById(`pe_${id}_name`).value.trim()   || p.name;
  p.desc   = document.getElementById(`pe_${id}_desc`).value.trim();
  p.price  = document.getElementById(`pe_${id}_price`).value.trim();
  p.badge  = document.getElementById(`pe_${id}_badge`).value.trim();
  p.hidden = document.getElementById(`pe_${id}_hidden`).value === '1';
  saveProducts(prods); renderProductGrid(); _tabProducts();
}
function adminAddProd() {
  const body = document.getElementById('adminTabBody_products');
  if (document.getElementById('prodf_NEW')) { document.getElementById('prodf_NEW').classList.toggle('open'); return; }
  const div = document.createElement('div'); div.id = 'prodf_NEW'; div.className = 'admin-edit-form open';
  div.innerHTML = `<div class="admin-form-row">
    <div class="form-group"><label>Emoji</label><input id="pe_NEW_emoji" value="✨"/></div>
    <div class="form-group"><label>Category</label><input id="pe_NEW_cat" value="Aftercare"/></div>
  </div>
  <div class="form-group" style="margin-top:8px"><label>Name</label><input id="pe_NEW_name" placeholder="Product name"/></div>
  <div class="form-group" style="margin-top:8px"><label>Description</label><textarea id="pe_NEW_desc" rows="2" placeholder="Description..."></textarea></div>
  <div class="admin-form-row" style="margin-top:8px">
    <div class="form-group"><label>Price</label><input id="pe_NEW_price" value="£"/></div>
    <div class="form-group"><label>Badge</label><input id="pe_NEW_badge" placeholder="e.g. New"/></div>
  </div>
  <div class="admin-edit-actions">
    <button class="admin-btn admin-btn-save" onclick="adminSaveNewProd()">Add</button>
    <button class="admin-btn admin-btn-cancel" onclick="this.closest('.admin-edit-form').remove()">Cancel</button>
  </div>`;
  body.querySelector('.admin-btn-add').before(div);
}
function adminSaveNewProd() {
  const name = document.getElementById('pe_NEW_name').value.trim();
  if (!name) { alert('Enter a product name.'); return; }
  const prods = getProducts();
  prods.push({ id:'pp'+Date.now(), emoji:document.getElementById('pe_NEW_emoji').value.trim()||'✨',
    cat:document.getElementById('pe_NEW_cat').value.trim(), name,
    desc:document.getElementById('pe_NEW_desc').value.trim(), price:document.getElementById('pe_NEW_price').value.trim(),
    badge:document.getElementById('pe_NEW_badge').value.trim(), hidden:false, inStock:true });
  saveProducts(prods); renderProductGrid(); _tabProducts();
}

// ─── REVIEWS ───
function _tabReviews() {
  const pending = getPendingReviews();
  const published = getPublishedTestimonials() || [];
  document.getElementById('adminReviewBadge').textContent = pending.length;
  document.getElementById('adminTabBody_reviews').innerHTML = `
    <div class="admin-section-head"><h4>Pending (${pending.length})</h4></div>
    ${pending.length ? pending.map(r => `
      <div class="admin-review-card">
        <div class="admin-review-head">
          <div><strong>${esc(r.name)}</strong> · <span style="color:var(--gold)">${'★'.repeat(r.rating)}</span> · <span style="font-size:.8rem;color:var(--mid)">${esc(r.service)}</span></div>
          <span style="font-size:.75rem;color:var(--mid)">${esc(r.date)}</span>
        </div>
        <div class="admin-review-comment">"${esc(r.comment)}"</div>
        ${r.photo?`<img src="${r.photo}" style="max-width:100px;border-radius:8px;margin-top:8px;display:block" alt="">` : ''}
        <div class="admin-review-actions">
          <button class="admin-btn admin-btn-save" onclick="adminApproveReview('${r.id}')">Approve &amp; Publish</button>
          <button class="admin-btn admin-btn-del"  onclick="adminRejectReview('${r.id}')">Reject &amp; Delete</button>
        </div>
      </div>`).join('') : '<p class="admin-tab-hint">No pending reviews.</p>'}
    <div class="admin-section-head" style="margin-top:24px"><h4>Published (${published.length})</h4></div>
    ${published.length ? published.map((r,i) => `
      <div class="admin-review-card">
        <div class="admin-review-head">
          <div><strong>${esc(r.name)}</strong> · <span style="color:var(--gold)">${'★'.repeat(r.rating||5)}</span>${r.featured?' <span class="admin-featured-tag">Featured</span>':''}</div>
          <div style="display:flex;gap:6px">
            <button class="admin-btn admin-btn-toggle${r.featured?' active':''}" onclick="adminToggleFeatured(${i})">${r.featured?'Unfeature':'Feature'}</button>
            <button class="admin-btn admin-btn-del" onclick="adminDelPublished(${i})">Remove</button>
          </div>
        </div>
        <div class="admin-review-comment" style="margin-top:8px">"${esc(r.comment)}"</div>
      </div>`).join('') : '<p class="admin-tab-hint">No published reviews.</p>'}`;
}
function adminApproveReview(id) {
  const pending = getPendingReviews(); const r = pending.find(x => x.id === id); if (!r) return;
  const pub = getPublishedTestimonials() || [];
  pub.push({ name:r.name, service:r.service, rating:r.rating, comment:r.comment, featured:false });
  savePublishedTestimonials(pub);
  safeStore('ppb_feedback_pending', JSON.stringify(pending.filter(x => x.id !== id)));
  renderTestimonials(); _tabReviews();
}
function adminRejectReview(id) {
  if (!confirm('Delete this review?')) return;
  safeStore('ppb_feedback_pending', JSON.stringify(getPendingReviews().filter(x => x.id !== id)));
  _tabReviews();
}
function adminDelPublished(i) {
  if (!confirm('Remove this published review?')) return;
  savePublishedTestimonials((getPublishedTestimonials()||[]).filter((_,idx) => idx !== i));
  renderTestimonials(); _tabReviews();
}
function adminToggleFeatured(i) {
  const pub = getPublishedTestimonials() || [];
  if (pub[i]) pub[i].featured = !pub[i].featured;
  savePublishedTestimonials(pub); renderTestimonials(); _tabReviews();
}

// ─── PHOTOS ───
function _tabPhotos() {
  const photos = getGalleryPhotos();
  document.getElementById('adminTabBody_photos').innerHTML = `
    <p class="admin-tab-hint">Upload photos for the gallery. Auto-compressed to JPEG.</p>
    <div class="admin-photo-grid">${photos.map((p,i) => `
      <div class="admin-photo-item">
        <img class="admin-photo-img" src="${p.dataUrl}" alt="${esc(p.caption)}">
        <div class="admin-photo-caption">${esc(p.caption)}</div>
        <button class="admin-photo-del" onclick="adminDelPhoto(${i})">✕</button>
      </div>`).join('')}</div>
    ${!photos.length ? '<p class="admin-tab-hint">No photos uploaded yet.</p>' : ''}
    <div class="admin-form-row" style="margin-bottom:12px">
      <div class="form-group"><label>Caption</label><input id="photoCaption" placeholder="e.g. Classic Extensions"/></div>
      <div class="form-group"><label>Category</label><select id="photoCategory">
        <option value="extensions">Extensions</option>
        <option value="lift">Lash Lift &amp; Tint</option>
      </select></div>
    </div>
    <label class="admin-upload-btn">+ Upload Photo
      <input type="file" accept="image/*" style="display:none" onchange="adminUploadPhoto(this)"/>
    </label>`;
}
function adminDelPhoto(i) {
  if (!confirm('Delete photo?')) return;
  saveGalleryPhotos(getGalleryPhotos().filter((_,idx) => idx !== i));
  renderGallery(); _tabPhotos();
}
function adminUploadPhoto(input) {
  const file = input.files[0]; if (!file) return;
  const caption  = document.getElementById('photoCaption').value.trim() || 'Photo';
  const category = document.getElementById('photoCategory').value;
  compressImage(file, 1200, 0.78, dataUrl => {
    const photos = getGalleryPhotos();
    photos.push({ dataUrl, caption, category, cls:'' });
    if (saveGalleryPhotos(photos)) { renderGallery(); _tabPhotos(); }
  });
}

// ─── CONTACT ───
function _tabContact() {
  const c = getContactInfo();
  document.getElementById('adminTabBody_contact').innerHTML = `
    <div class="admin-section-head"><h4>Contact Details</h4></div>
    <div class="admin-form-row">
      <div class="form-group"><label>Phone</label><input id="ct_phone" value="${esc(c.phone)}" placeholder="+44 7700 900000"/></div>
      <div class="form-group"><label>Email</label><input id="ct_email" value="${esc(c.email)}" placeholder="hello@puppybeautybar.co.uk"/></div>
    </div>
    <div class="admin-form-row" style="margin-top:10px">
      <div class="form-group"><label>Street Address</label><input id="ct_addr" value="${esc(c.address)}" placeholder="123 High Street"/></div>
      <div class="form-group"><label>City &amp; Postcode</label><input id="ct_city" value="${esc(c.city)}" placeholder="London, E1 1AA"/></div>
    </div>
    <div class="form-group" style="margin-top:10px"><label>Opening Hours</label><input id="ct_hours" value="${esc(c.hours)}" placeholder="Mon–Sun: 10:00 AM – 5:00 PM"/></div>
    <div class="admin-section-head" style="margin-top:20px"><h4>Social Media Links</h4></div>
    <div class="admin-form-row">
      <div class="form-group"><label>Instagram URL</label><input id="ct_ig" value="${esc(c.instagram)}" placeholder="https://instagram.com/..."/></div>
      <div class="form-group"><label>Facebook URL</label><input id="ct_fb" value="${esc(c.facebook)}" placeholder="https://facebook.com/..."/></div>
    </div>
    <div class="form-group" style="margin-top:10px"><label>TikTok URL</label><input id="ct_tt" value="${esc(c.tiktok)}" placeholder="https://tiktok.com/@..."/></div>
    <div class="admin-section-head" style="margin-top:20px"><h4>WhatsApp &amp; Map</h4></div>
    <div class="admin-form-row">
      <div class="form-group"><label>WhatsApp Number <span style="color:var(--mid);font-weight:400">(with country code, e.g. +447700900000)</span></label>
        <input id="ct_wa" value="${esc(c.whatsapp||'')}" placeholder="+447700900000"/>
      </div>
      <div class="form-group"><label>Google Maps Embed URL</label>
        <input id="ct_maps" value="${esc(c.mapsUrl||'')}" placeholder="https://www.google.com/maps/embed?pb=…"/>
      </div>
    </div>
    <div class="admin-section-head" style="margin-top:18px"><h4>QR Codes (Image URLs or Upload)</h4></div>
    <p class="admin-tab-hint">Provide an image URL or upload a JPEG/PNG. Uploaded images are stored as data URLs and used immediately.</p>
    <div class="admin-form-row" style="margin-top:8px">
      <div class="form-group">
        <label>WeChat QR Image URL</label>
        <input id="ct_wechatQr" value="${esc(c.wechatQr||'')}" placeholder="https://…/wechat-qr.png"/>
        <input type="file" id="ct_wechatQrFile" accept="image/*" style="margin-top:8px" />
      </div>
      <div class="form-group">
        <label>WhatsApp QR Image URL</label>
        <input id="ct_whatsappQr" value="${esc(c.whatsappQr||'')}" placeholder="https://…/whatsapp-qr.png"/>
        <input type="file" id="ct_whatsappQrFile" accept="image/*" style="margin-top:8px" />
      </div>
    </div>
    <div class="form-group" style="margin-top:10px">
      <label>Instagram QR Image URL</label>
      <input id="ct_instagramQr" value="${esc(c.instagramQr||'')}" placeholder="https://…/instagram-qr.png"/>
      <input type="file" id="ct_instagramQrFile" accept="image/*" style="margin-top:8px" />
    </div>
    <p class="admin-tab-hint" style="margin-top:6px">For the Maps URL: go to Google Maps → share your location → Embed a map → copy the <code>src="…"</code> URL.</p>
    <button class="btn-primary" style="margin-top:20px;width:100%" onclick="adminSaveContact()">Save Contact Info</button>`;
}
async function adminSaveContact() {
  const fileToDataUrl = file => new Promise((res, rej) => {
    if (!file) return res(null);
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });

  const wechatFile = document.getElementById('ct_wechatQrFile') ? document.getElementById('ct_wechatQrFile').files[0] : null;
  const whatsappFile = document.getElementById('ct_whatsappQrFile') ? document.getElementById('ct_whatsappQrFile').files[0] : null;
  const instagramFile = document.getElementById('ct_instagramQrFile') ? document.getElementById('ct_instagramQrFile').files[0] : null;

  let wechatData = null, whatsappData = null, instagramData = null;
  try {
    [wechatData, whatsappData, instagramData] = await Promise.all([
      fileToDataUrl(wechatFile), fileToDataUrl(whatsappFile), fileToDataUrl(instagramFile)
    ]);
  } catch(e) {
    alert('Failed to read uploaded image(s). Please try again.');
    return;
  }

  const c = {
    phone: document.getElementById('ct_phone').value.trim(),
    email: document.getElementById('ct_email').value.trim(),
    address: document.getElementById('ct_addr').value.trim(),
    city: document.getElementById('ct_city').value.trim(),
    hours: document.getElementById('ct_hours').value.trim(),
    instagram: document.getElementById('ct_ig').value.trim(),
    facebook: document.getElementById('ct_fb').value.trim(),
    tiktok: document.getElementById('ct_tt').value.trim(),
    whatsapp: document.getElementById('ct_wa').value.trim(),
    mapsUrl: document.getElementById('ct_maps').value.trim(),
    wechatQr: wechatData || document.getElementById('ct_wechatQr').value.trim(),
    whatsappQr: whatsappData || document.getElementById('ct_whatsappQr').value.trim(),
    instagramQr: instagramData || document.getElementById('ct_instagramQr').value.trim()
  };

  saveContactInfo(c); renderContactInfo();
  const btn = document.querySelector('#adminTabBody_contact .btn-primary');
  if (btn) { const orig = btn.textContent; btn.textContent = 'Saved!'; setTimeout(() => { btn.textContent = orig; }, 2000); }
}

// ─── BOOKINGS ───
function _tabBookings() {
  const today    = new Date().toISOString().split('T')[0];
  const all      = getBookings().sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : ALL_SLOTS.indexOf(a.time) - ALL_SLOTS.indexOf(b.time));
  const upcoming = all.filter(b => b.date >= today);
  const past     = all.filter(b => b.date <  today);
  const activeServices = getServices().filter(s => s.status === 'active');
  document.getElementById('adminTabBody_bookings').innerHTML =
    `<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="admin-btn admin-btn-edit" onclick="adminExportCSV()">⬇ Export CSV</button>
    </div>` +
    `<div class="admin-section-head"><h4>Upcoming Appointments (${upcoming.length})</h4></div>` +
    (upcoming.length ? upcoming.map(_bookingCard).join('') : '<p class="admin-tab-hint">No upcoming bookings.</p>') +
    (past.length
      ? `<details style="margin-top:16px"><summary style="cursor:pointer;font-size:.84rem;font-weight:600;color:var(--mid);padding:6px 0">Past bookings (${past.length})</summary>${past.map(_bookingCard).join('')}</details>`
      : '') +
    `` +
    `<div class="admin-section-head" style="margin-top:24px"><h4>Add Manual Booking</h4></div>
    <div class="admin-edit-form open">
      <div class="admin-form-row">
        <div class="form-group"><label>First Name *</label><input id="mb_fname" placeholder="Jane"/></div>
        <div class="form-group"><label>Last Name *</label><input id="mb_lname" placeholder="Smith"/></div>
      </div>
      <div class="admin-form-row" style="margin-top:8px">
        <div class="form-group"><label>Phone</label><input id="mb_phone" placeholder="+44 7700 900000"/></div>
        <div class="form-group"><label>Email</label><input type="email" id="mb_email" placeholder="jane@email.com"/></div>
      </div>
      <div class="form-group" style="margin-top:8px"><label>Service *</label>
        <select id="mb_svc">
          <option value="">— Select Service —</option>
          ${activeServices.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('')}
        </select>
      </div>
      <div class="admin-form-row" style="margin-top:8px">
        <div class="form-group"><label>Date *</label><input type="date" id="mb_date" onchange="adminUpdateManualSlots()"/></div>
        <div class="form-group"><label>Time *</label><select id="mb_time"><option value="">— Select Date First —</option></select></div>
      </div>
      <div class="form-group" style="margin-top:8px"><label>Notes</label><textarea id="mb_notes" rows="2" placeholder="Any special notes…"></textarea></div>
      <div class="form-group" style="margin-top:8px"><label>Payment</label>
        <select id="mb_pay">
          <option value="Cash">Cash (Pay in Studio)</option>
          <option value="Card (In-Studio)">Card (In-Studio)</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Deposit Paid Online">Deposit Paid Online</option>
          <option value="Complimentary">Complimentary</option>
        </select>
      </div>
      <button class="admin-btn admin-btn-save" style="margin-top:12px" onclick="adminAddManualBooking()">Add Booking</button>
    </div>`;
}

function _bookingCard(b) {
  const today = new Date().toISOString().split('T')[0];
  const isUpcoming = b.date >= today;
  return `<div class="admin-review-card">
    <div class="admin-review-head">
      <div>
        <strong>${esc(b.firstName)} ${esc(b.lastName)}</strong>
        <span style="color:var(--pink);font-weight:700;margin:0 6px">${esc(_fmtDate(b.date))} · ${esc(b.time)}</span>
        ${esc(b.serviceName)} <span style="color:var(--mid);font-size:.76rem">(${b.durationMins} min)</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
        ${isUpcoming ? `<button class="admin-btn admin-btn-edit" onclick="adminSendReminder('${b.id}')">📧 Reminder</button>` : ''}
        ${!isUpcoming && !b.attended ? `<button class="admin-btn admin-btn-save" onclick="adminMarkAttended('${b.id}')">Mark Attended</button>` : ''}
        ${!isUpcoming && b.attended ? (isMember(b.email) ? `<button class="admin-btn admin-btn-edit" disabled>Attended ✓</button>` : `<button class="admin-btn admin-btn-save" onclick="adminGrantMembership('${esc(b.email||'')}','${esc(b.firstName+' '+b.lastName)}')">Grant Membership</button>`) : ''}
        <button class="admin-btn admin-btn-del" onclick="adminCancelBookingFromTab('${b.id}')">Cancel</button>
      </div>
    </div>
    <div style="font-size:.8rem;color:var(--mid);margin-top:6px">
      📞 ${esc(b.phone || '—')} &nbsp;·&nbsp; 📧 ${esc(b.email || '—')} &nbsp;·&nbsp; 💳 ${esc(b.paymentMethod)}
      ${b.notes ? `<br>💬 ${esc(b.notes)}` : ''}
    </div>
  </div>`;
}

function adminCancelBookingFromTab(id) {
  if (!confirm('Cancel this booking? The slots will be freed.')) return;
  saveBookings(getBookings().filter(b => b.id !== id));
  _tabBookings();
}
function adminDelPatchTest(id) {
  if (!confirm('Delete this patch test request?')) return;
  savePatchTests(getPatchTests().filter(p => p.id !== id));
  _tabBookings();
}

function adminMarkAttended(id) {
  if (!confirm('Mark this booking as attended?')) return;
  const bs = getBookings(); const b = bs.find(x => x.id === id); if (!b) return;
  b.attended = true; saveBookings(bs); _tabBookings();
}

function adminGrantMembership(email, name) {
  if (!email) { alert('Email is required to grant membership.'); return; }
  if (!confirm('Grant membership to ' + (name || email) + '?')) return;
  const members = getMembers();
  if (members.some(m => (m.email||'').toLowerCase() === email.toLowerCase())) { alert('This user is already a member.'); return; }
  members.push({ email, name: name || '', grantedAt: new Date().toISOString() });
  saveMembers(members); _tabBookings();
}

function adminUpdateManualSlots() {
  const date = document.getElementById('mb_date').value;
  const sel  = document.getElementById('mb_time');
  if (!sel) return;
  if (!date) { sel.innerHTML = '<option value="">— Select Date First —</option>'; return; }
  const slots = getAvailableSlotsForDate(date);
  sel.innerHTML = '<option value="">— Select Time —</option>';
  if (!slots.length) { sel.innerHTML = '<option value="">— No slots available —</option>'; return; }
  slots.forEach(slot => { const o = document.createElement('option'); o.value = slot; o.textContent = slot; sel.appendChild(o); });
}

function adminAddManualBooking() {
  const firstName = document.getElementById('mb_fname').value.trim();
  const lastName  = document.getElementById('mb_lname').value.trim();
  const phone     = document.getElementById('mb_phone').value.trim();
  const email     = document.getElementById('mb_email').value.trim();
  const service   = document.getElementById('mb_svc').value;
  const date      = document.getElementById('mb_date').value;
  const time      = document.getElementById('mb_time').value;
  const notes     = document.getElementById('mb_notes').value.trim();
  const payMethod = document.getElementById('mb_pay').value;
  if (!firstName || !lastName) { alert('Please enter the full name.'); return; }
  if (!service)  { alert('Please select a service.'); return; }
  if (!date)     { alert('Please select a date.'); return; }
  if (!time || time.startsWith('—')) { alert('Please select a time slot.'); return; }
  const svc = getServices().find(s => s.name === service);
  const durationMins = parseDurationMins(svc ? svc.duration : '60 min');
  const bookings = getBookings();
  bookings.push({
    id: 'b' + Date.now(), date, time, serviceName: service, durationMins,
    firstName, lastName, email, phone,
    notes, paymentMethod: payMethod, timestamp: Date.now()
  });
  saveBookings(bookings);
  document.getElementById('adminBookingBadge').textContent =
    getBookings().filter(b => b.date >= new Date().toISOString().split('T')[0]).length;
  _tabBookings();
}

// ─── SETTINGS ───
function _tabSettings() {
  const cfg = _cfg();
  document.getElementById('adminTabBody_settings').innerHTML = `
    <div class="admin-section-head"><h4>Payment Settings</h4></div>
    <div class="admin-form-row">
      <div class="form-group"><label>Deposit Amount (£)</label>
        <input type="number" id="st_deposit" value="${cfg.depositAmount}" min="1" step="1"/>
      </div>
      <div class="form-group"><label>Business Email (for enquiries &amp; notifications)</label>
        <input type="email" id="st_bizEmail" value="${esc(cfg.businessEmail)}" placeholder="hello@yoursalon.co.uk"/>
      </div>
    </div>
    <div class="admin-form-row" style="margin-top:10px">
      <div class="form-group"><label>Enable Card Payments</label>
        <select id="st_enableCard">
          <option value="1"${cfg.enableCard ? ' selected' : ''}>Yes</option>
          <option value="0"${!cfg.enableCard ? ' selected' : ''}>No</option>
        </select>
      </div>
      <div class="form-group"><label>Enable WeChat Pay</label>
        <select id="st_enableWechat">
          <option value="1"${cfg.enableWechat ? ' selected' : ''}>Yes</option>
          <option value="0"${!cfg.enableWechat ? ' selected' : ''}>No</option>
        </select>
      </div>
    </div>

    <div class="admin-section-head" style="margin-top:22px"><h4>Promo Codes</h4></div>
    <p class="admin-tab-hint">One code per line: <code>CODE:discount_amount</code> (e.g. <code>WELCOME:5</code> gives £5 off the deposit). Set the amount equal to the deposit to waive it entirely.</p>
    <textarea id="st_promoCodes" rows="4" style="width:100%;padding:10px;border:1.5px solid #F0CBDA;border-radius:10px;font-family:'Inter',sans-serif;font-size:.84rem;resize:vertical" placeholder="FIRSTVISIT:5&#10;FRIEND:10&#10;VIP:10">${(cfg.promoCodes||[]).map(p => p.code+':'+p.amount).join('\n')}</textarea>

    <div class="admin-section-head" style="margin-top:22px"><h4>Stripe (Card Payments)</h4></div>
    <p class="admin-tab-hint">Get your keys from <strong>dashboard.stripe.com → Developers → API keys</strong>. A server-side endpoint is also required to create payment intents securely.</p>
    <div class="form-group"><label>Stripe Publishable Key</label>
      <input id="st_stripeKey" value="${esc(cfg.stripeKey)}" placeholder="pk_live_…" autocomplete="off"/>
    </div>
    <div class="form-group" style="margin-top:10px"><label>Backend Endpoint URL <span style="color:var(--mid);font-weight:400">(your /create-payment-intent server)</span></label>
      <input id="st_endpoint" value="${esc(cfg.paymentEndpoint)}" placeholder="https://your-server.com/create-payment-intent"/>
    </div>

    <div class="admin-section-head" style="margin-top:22px"><h4>WeChat Pay</h4></div>
    <div class="form-group"><label>WeChat QR Code Image URL</label>
      <input id="st_wechatQr" value="${esc(cfg.wechatQrUrl)}" placeholder="https://… or /images/wechat-qr.png"/>
    </div>

    <div class="admin-section-head" style="margin-top:22px"><h4>Site Content</h4></div>
    <div class="form-group"><label>Terms — Allergy Clause (appears under T&Cs)</label>
      <textarea id="st_tcAllergy" rows="4" style="width:100%;padding:10px;border:1.5px solid #F0CBDA;border-radius:10px;font-family:'Inter',sans-serif;font-size:.84rem;resize:vertical">${esc(cfg.customTermsAllergy||'')}</textarea>
    </div>

    <div class="admin-section-head" style="margin-top:22px"><h4>Confirmation Emails (EmailJS)</h4></div>
    <p class="admin-tab-hint">Free account at <strong>emailjs.com</strong>. Create an Email Service, then two templates — one sent to the client, one sent to you. Set template variables: <code>{{to_email}}</code>, <code>{{to_name}}</code>, <code>{{service}}</code>, <code>{{booking_date}}</code>, <code>{{booking_time}}</code>, <code>{{deposit_amount}}</code>, <code>{{payment_method}}</code>, <code>{{phone}}</code>, <code>{{notes}}</code>.</p>
    <div class="admin-form-row">
      <div class="form-group"><label>EmailJS Service ID</label>
        <input id="st_ejsService" value="${esc(cfg.emailjsServiceId)}" placeholder="service_xxxxxxx" autocomplete="off"/>
      </div>
      <div class="form-group"><label>EmailJS Public Key</label>
        <input id="st_ejsKey" value="${esc(cfg.emailjsPublicKey)}" placeholder="xxxxxxxxxxxxxxxx" autocomplete="off"/>
      </div>
    </div>
    <div class="admin-form-row" style="margin-top:10px">
      <div class="form-group"><label>Client Confirmation Template ID</label>
        <input id="st_ejsClientTpl" value="${esc(cfg.emailjsClientTpl)}" placeholder="template_xxxxxxx"/>
      </div>
      <div class="form-group"><label>Business Notification Template ID</label>
        <input id="st_ejsBizTpl" value="${esc(cfg.emailjsBizTpl)}" placeholder="template_xxxxxxx"/>
      </div>
    </div>
    <div class="admin-form-row" style="margin-top:10px">
      <div class="form-group"><label>Reminder Template ID <span style="color:var(--mid);font-weight:400">(for manual reminders in Bookings tab)</span></label>
        <input id="st_reminderTpl" value="${esc(cfg.reminderTpl)}" placeholder="template_xxxxxxx"/>
      </div>
      <div class="form-group"></div>
    </div>

    <div class="admin-section-head" style="margin-top:22px"><h4>Admin Credentials</h4></div>
    <p class="admin-tab-hint">Current password is required to save any credential changes.</p>
    <div class="admin-form-row">
      <div class="form-group"><label>New Username <span style="color:var(--mid);font-weight:400">(leave blank to keep current)</span></label>
        <input id="st_newUser" placeholder="admin" autocomplete="off"/>
      </div>
      <div class="form-group"><label>Current Password *</label>
        <input type="password" id="st_curPass" autocomplete="current-password"/>
      </div>
    </div>
    <div class="admin-form-row" style="margin-top:10px">
      <div class="form-group"><label>New Password <span style="color:var(--mid);font-weight:400">(leave blank to keep current)</span></label>
        <input type="password" id="st_newPass" autocomplete="new-password"/>
      </div>
      <div class="form-group"><label>Confirm New Password</label>
        <input type="password" id="st_newPass2" autocomplete="new-password"/>
      </div>
    </div>

    <button class="btn-primary" style="margin-top:22px;width:100%" onclick="adminSaveSettings()">Save All Settings</button>
  `;
}

function adminSaveSettings() {
  // Handle optional credential change
  const curPass  = document.getElementById('st_curPass').value;
  const newUser  = document.getElementById('st_newUser').value.trim();
  const newPass  = document.getElementById('st_newPass').value;
  const newPass2 = document.getElementById('st_newPass2').value;
  if (newUser || newPass) {
    const creds = getAdminCredentials();
    if (curPass !== creds.password) { alert('Current password is incorrect — credentials not updated.'); return; }
    if (newPass && newPass !== newPass2) { alert('New passwords do not match.'); return; }
    saveAdminCredentials({ username: newUser || creds.username, password: newPass || creds.password });
  }
  // Save payment & integration settings
  savePaymentSettings({
    depositAmount:    parseFloat(document.getElementById('st_deposit').value) || DEPOSIT_AMOUNT_GBP,
    businessEmail:    document.getElementById('st_bizEmail').value.trim(),
    enableCard:       document.getElementById('st_enableCard').value   === '1',
    enableWechat:     document.getElementById('st_enableWechat').value === '1',
    stripeKey:        document.getElementById('st_stripeKey').value.trim(),
    paymentEndpoint:  document.getElementById('st_endpoint').value.trim(),
    wechatQrUrl:      document.getElementById('st_wechatQr').value.trim(),
    emailjsServiceId: document.getElementById('st_ejsService').value.trim(),
    emailjsPublicKey: document.getElementById('st_ejsKey').value.trim(),
    emailjsClientTpl: document.getElementById('st_ejsClientTpl').value.trim(),
    emailjsBizTpl:    document.getElementById('st_ejsBizTpl').value.trim(),
    reminderTpl:      document.getElementById('st_reminderTpl').value.trim(),
    promoCodes: (document.getElementById('st_promoCodes').value || '')
      .split('\n').map(l => l.trim()).filter(l => l.includes(':'))
      .map(l => { const [c, a] = l.split(':'); return { code:(c||'').trim().toUpperCase(), amount:parseFloat(a)||0 }; })
      .filter(p => p.code),
    customTermsAllergy: (document.getElementById('st_tcAllergy') ? document.getElementById('st_tcAllergy').value.trim() : '')
  });
  // Reset Stripe so it reinitialises with the new key on next booking
  if (_stripeCard) { try { _stripeCard.unmount(); } catch(e) {} }
  _stripe = null; _stripeElements = null; _stripeCard = null;
  const btn = document.querySelector('#adminTabBody_settings .btn-primary');
  if (btn) { const orig = btn.textContent; btn.textContent = '✓ Saved!'; setTimeout(() => { btn.textContent = orig; }, 2000); }
  renderCustomTermsClause();
}

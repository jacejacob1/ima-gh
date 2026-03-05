<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import BookingCard from './components/BookingCard.vue';
import {
  apiCreateBlock,
  apiCreateBooking,
  apiDeleteBlock,
  apiDeleteBooking,
  apiGetActiveBookings,
  apiGetAdminBookings,
  apiGetAdminAnalytics,
  apiGetBlockedSlots,
  apiGetGuestBookings,
  apiGetInventory,
  apiDownloadGuestInvoice,
  apiLogin,
  apiRequestGuestOtp,
  apiSubmitFeedback,
  apiVerifyGuestOtp,
} from './api.js';

const currentPage = ref('home');
const inventory = ref([]);
const bookings = ref([]);
const blockedSlots = ref([]);
const activeBookings = ref([]);
const selectedShowcaseSpace = ref(null);
const analytics = ref({
  summary: {
    totalBookings: 0,
    activeBookings: 0,
    paidRevenue: 0,
    pendingPayments: 0,
  },
  bookingsBySpace: [],
  mealDemand: { breakfast: 0, lunch: 0, dinner: 0 },
  monthlyRevenue: [],
});

const auth = ref(loadAuth());
const guestAuth = ref(loadGuestAuth());
const adminUsername = ref('');
const adminPassword = ref('');

const bookingForm = ref(getEmptyBookingForm());
const BOOKING_TOTAL_STEPS = 7;
const bookingStep = ref(1);
const feedbackForm = ref({ bookingId: '', note: '' });
const guestLoginForm = ref({
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  otpCode: '',
});
const otpRequested = ref(false);
const guestBookings = ref([]);
const blockForm = ref({
  eventName: '',
  spaceId: '',
  startDateTime: '',
  endDateTime: '',
  reason: '',
});

const toast = ref('');
let toastTimer;
const isBootLoading = ref(true);
const loadingProgress = ref(0);
const isMenuOpen = ref(false);
let loadingTimer;

const spacesForSelection = computed(() =>
  inventory.value.filter((item) => item.type === bookingForm.value.hallOrRoom)
);
const activeBlockCount = computed(() =>
  blockedSlots.value.filter((slot) => new Date(slot.endDateTime).getTime() > Date.now()).length
);
const isAdmin = computed(() => auth.value.role === 'admin');
const isManager = computed(() => auth.value.role === 'manager');
const canViewAdminData = computed(() => isAdmin.value || isManager.value);
const isGuestLoggedIn = computed(() => Boolean(guestAuth.value.token));
const selectedSpaceDetails = computed(() =>
  inventory.value.find((item) => item.id === bookingForm.value.selectedSpaceId) || null
);
const galleryItems = computed(() =>
  inventory.value.flatMap((space) =>
    (space.gallery || [space.image]).map((photo, index) => ({
      id: `${space.id}-${index}`,
      name: space.name,
      photo,
    }))
  )
);
const bookingChoices = computed(() => inventory.value);
const bookingStepLabel = computed(() => {
  const labels = {
    1: 'Guest Name',
    2: 'Guest Number',
    3: 'Government ID Verification',
    4: 'Select Space',
    5: 'Stay Preferences',
    6: 'Payment Method',
    7: 'Review & Confirm',
  };
  return labels[bookingStep.value] || '';
});
const bookingProgress = computed(() =>
  Math.round((bookingStep.value / BOOKING_TOTAL_STEPS) * 100)
);
const homeQuotes = [
  '“Where care meets comfort, every stay feels restorative.”',
  '“Designed for healers, built for peace, powered by service.”',
  '“From late check-ins to early rounds, we stay ready for you.”',
];
const currentQuoteIndex = ref(0);
let quoteTimer;

const homeHighlights = [
  {
    title: '24/7 Access',
    caption: 'Check-in anytime. We understand the unpredictable schedule of medical professionals.',
    tag: 'Any Time',
  },
  {
    title: 'Healthy Dining',
    caption: 'Nutritious veg and non-veg meals prepared fresh daily for our guests.',
    tag: 'Fresh Food',
  },
  {
    title: 'Sparkling Clean',
    caption: 'Hospital-grade hygiene standards and daily housekeeping service.',
    tag: 'Sanitized',
  },
  {
    title: 'Travel Desk',
    caption: 'Seamless airport transfers and city cab bookings managed for you.',
    tag: 'Concierge',
  },
  {
    title: 'Event Hall',
    caption: 'Premium conference setup with AV support for up to 180 delegates.',
    tag: '180 Seats',
  },
  {
    title: 'Warm Service',
    caption: 'Our front desk team is dedicated to making your stay effortless.',
    tag: 'Hospitality',
  },
];

const heroBackgroundStyle = computed(() => ({
  backgroundImage: `url(${inventory.value[0]?.image || ''})`,
}));

const UPI_ID = import.meta.env.VITE_IMA_UPI_ID || 'secretary@imatnsb-hqgh.com';
const UPI_PAYEE_NAME = import.meta.env.VITE_IMA_UPI_NAME || 'IMA Guesthouse';

const estimatedAmountInr = computed(() => {
  const selected = selectedSpaceDetails.value;
  if (!selected) return 0;

  const checkin = new Date(bookingForm.value.checkinDateTime).getTime();
  const checkout = new Date(bookingForm.value.checkoutDateTime).getTime();
  if (!Number.isFinite(checkin) || !Number.isFinite(checkout) || checkout <= checkin) return 0;

  if (selected.type === 'Room') {
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.max(1, Math.ceil((checkout - checkin) / dayMs));
    return days * 2000;
  }

  const hours = (checkout - checkin) / (1000 * 60 * 60);
  return hours <= 6 ? 40000 : 80000;
});

const upiPaymentUri = computed(() => {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    cu: 'INR',
  });
  if (estimatedAmountInr.value > 0) {
    params.set('am', String(estimatedAmountInr.value));
  }
  return `upi://pay?${params.toString()}`;
});

const upiQrImageUrl = computed(
  () => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPaymentUri.value)}`
);

function getEmptyBookingForm() {
  return {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    branch: '',
    idProofType: '',
    idProofNumber: '',
    hallOrRoom: '',
    selectedSpaceId: '',
    checkinDateTime: '',
    checkoutDateTime: '',
    foodPreference: '',
    meals: [],
    cabService: '',
    paymentMethod: '',
    transactionRef: '',
  };
}

function loadAuth() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem('ima_auth') || '{}');
    return {
      token: parsed.token || '',
      role: parsed.role || '',
      username: parsed.username || '',
    };
  } catch {
    return { token: '', role: '', username: '' };
  }
}

function saveAuth(value) {
  auth.value = value;
  sessionStorage.setItem('ima_auth', JSON.stringify(value));
}

function clearAuth() {
  saveAuth({ token: '', role: '', username: '' });
}

function loadGuestAuth() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem('ima_guest_auth') || '{}');
    return {
      token: parsed.token || '',
      guestName: parsed.guestName || '',
      guestEmail: parsed.guestEmail || '',
      guestPhone: parsed.guestPhone || '',
    };
  } catch {
    return { token: '', guestName: '', guestEmail: '', guestPhone: '' };
  }
}

function saveGuestAuth(value) {
  guestAuth.value = value;
  sessionStorage.setItem('ima_guest_auth', JSON.stringify(value));
}

function clearGuestAuth() {
  saveGuestAuth({ token: '', guestName: '', guestEmail: '', guestPhone: '' });
}

function notify(message) {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = '';
  }, 2600);
}

function goToPage(page) {
  currentPage.value = page;
  isMenuOpen.value = false;
  if (page === 'booking' && bookingStep.value < 1) {
    bookingStep.value = 1;
  }
}

function openSpaceDetails(space) {
  selectedShowcaseSpace.value = space;
  currentPage.value = 'space';
  isMenuOpen.value = false;
}

function selectBookingSpace(space) {
  bookingForm.value.hallOrRoom = space.type;
  bookingForm.value.selectedSpaceId = space.id;
}

function rotateQuote() {
  currentQuoteIndex.value = (currentQuoteIndex.value + 1) % homeQuotes.length;
}

function startQuoteRotation() {
  quoteTimer = setInterval(rotateQuote, 3200);
}

function stopQuoteRotation() {
  clearInterval(quoteTimer);
  quoteTimer = undefined;
}

function startBootLoader() {
  loadingProgress.value = 0;
  const stepMs = 80;
  const increment = 100 / 30;
  loadingTimer = setInterval(() => {
    loadingProgress.value = Math.min(100, Number((loadingProgress.value + increment).toFixed(0)));
    if (loadingProgress.value >= 100) {
      clearInterval(loadingTimer);
      loadingTimer = undefined;
      setTimeout(() => {
        isBootLoading.value = false;
      }, 120);
    }
  }, stepMs);
}

function onSpaceTypeChange() {
  bookingForm.value.selectedSpaceId = '';
}

function onMealToggle(meal) {
  const next = new Set(bookingForm.value.meals);
  if (next.has(meal)) {
    next.delete(meal);
  } else {
    next.add(meal);
  }
  bookingForm.value.meals = [...next];
}

function resetPaymentDetails() {
  bookingForm.value.transactionRef = '';
}

function onPaymentMethodChange() {
  resetPaymentDetails();
}

function openBookingPage(space) {
  currentPage.value = 'booking';
  bookingStep.value = 1;
  if (space) {
    bookingForm.value.hallOrRoom = space.type;
    bookingForm.value.selectedSpaceId = space.id;
  }
}

function validateBookingStep(step) {
  if (step === 1) {
    if (!bookingForm.value.guestName.trim()) {
      notify('Guest name is required to continue.');
      return false;
    }
  }

  if (step === 2) {
    const normalizedPhone = bookingForm.value.guestPhone.replace(/\D/g, '');
    if (normalizedPhone.length < 10) {
      notify('Enter a valid guest phone number to continue.');
      return false;
    }
  }

  if (step === 3) {
    if (
      !bookingForm.value.guestEmail.trim() ||
      !bookingForm.value.branch.trim() ||
      !bookingForm.value.idProofType ||
      !bookingForm.value.idProofNumber.trim()
    ) {
      notify('Complete branch, email, and government ID details to continue.');
      return false;
    }
  }

  if (step === 4) {
    if (!bookingForm.value.hallOrRoom || !bookingForm.value.selectedSpaceId) {
      notify('Select room/hall type and a specific option to continue.');
      return false;
    }
  }

  if (step === 5) {
    const checkin = new Date(bookingForm.value.checkinDateTime).getTime();
    const checkout = new Date(bookingForm.value.checkoutDateTime).getTime();
    if (!Number.isFinite(checkin) || !Number.isFinite(checkout) || checkout <= checkin) {
      notify('Checkout must be after checkin date/time.');
      return false;
    }
    if (!bookingForm.value.foodPreference || !bookingForm.value.cabService) {
      notify('Select food preference and cab requirement.');
      return false;
    }
    if (!bookingForm.value.meals.length) {
      notify('Select at least one meal: breakfast, lunch, or dinner.');
      return false;
    }
  }

  if (step === 6) {
    if (!bookingForm.value.paymentMethod) {
      notify('Select a payment method.');
      return false;
    }
    if (!['Google Pay / UPI', 'Pay on Arrival'].includes(bookingForm.value.paymentMethod)) {
      notify('Only Google Pay / UPI or Pay on Arrival is allowed.');
      return false;
    }
    if (
      bookingForm.value.paymentMethod === 'Google Pay / UPI' &&
      !bookingForm.value.transactionRef.trim()
    ) {
      notify('Transaction reference is required for Google Pay / UPI.');
      return false;
    }
  }

  return true;
}

function nextBookingStep() {
  if (!validateBookingStep(bookingStep.value)) return;
  bookingStep.value = Math.min(BOOKING_TOTAL_STEPS, bookingStep.value + 1);
}

function previousBookingStep() {
  bookingStep.value = Math.max(1, bookingStep.value - 1);
}

function validateBooking() {
  for (let step = 1; step < BOOKING_TOTAL_STEPS; step += 1) {
    if (!validateBookingStep(step)) {
      bookingStep.value = step;
      return false;
    }
  }

  return true;
}

async function loadPublicData() {
  const [inventoryResult, blocksResult, activeResult] = await Promise.allSettled([
    apiGetInventory(),
    apiGetBlockedSlots(),
    apiGetActiveBookings(),
  ]);

  if (inventoryResult.status === 'fulfilled') {
    inventory.value = Array.isArray(inventoryResult.value?.inventory) ? inventoryResult.value.inventory : [];
  } else {
    inventory.value = [];
  }

  if (blocksResult.status === 'fulfilled') {
    blockedSlots.value = Array.isArray(blocksResult.value?.blockedSlots)
      ? blocksResult.value.blockedSlots
      : [];
  } else {
    blockedSlots.value = [];
  }

  if (activeResult.status === 'fulfilled') {
    activeBookings.value = Array.isArray(activeResult.value?.bookings) ? activeResult.value.bookings : [];
  } else {
    activeBookings.value = [];
  }
}

async function loadAdminBookings() {
  if (!auth.value.token || !canViewAdminData.value) {
    bookings.value = [];
    return;
  }

  const response = await apiGetAdminBookings(auth.value.token);
  bookings.value = Array.isArray(response?.bookings) ? response.bookings : [];
}

async function loadAdminAnalytics() {
  if (!auth.value.token || !canViewAdminData.value) {
    analytics.value = {
      summary: { totalBookings: 0, activeBookings: 0, paidRevenue: 0, pendingPayments: 0 },
      bookingsBySpace: [],
      mealDemand: { breakfast: 0, lunch: 0, dinner: 0 },
      monthlyRevenue: [],
    };
    return;
  }
  const response = await apiGetAdminAnalytics(auth.value.token);
  analytics.value = response;
}

async function submitBooking() {
  if (!validateBooking()) return;

  let paymentDetails =
    bookingForm.value.paymentMethod === 'Google Pay / UPI'
      ? {
          upiId: UPI_ID,
          transactionRef: bookingForm.value.transactionRef,
          amountInr: estimatedAmountInr.value,
        }
      : {
          status: 'Pay at reception before checkin',
        };

  try {
    await apiCreateBooking({
      guestName: bookingForm.value.guestName,
      guestEmail: bookingForm.value.guestEmail,
      guestPhone: bookingForm.value.guestPhone,
      branch: bookingForm.value.branch,
      idProofType: bookingForm.value.idProofType,
      idProofNumber: bookingForm.value.idProofNumber,
      hallOrRoom: bookingForm.value.hallOrRoom,
      selectedSpaceId: bookingForm.value.selectedSpaceId,
      checkinDateTime: bookingForm.value.checkinDateTime,
      checkoutDateTime: bookingForm.value.checkoutDateTime,
      foodPreference: bookingForm.value.foodPreference,
      meals: bookingForm.value.meals,
      cabService: bookingForm.value.cabService,
      paymentMethod: bookingForm.value.paymentMethod,
      paymentDetails,
    });

    bookingForm.value = getEmptyBookingForm();
    bookingStep.value = 1;
    await loadPublicData();
    if (canViewAdminData.value) {
      await loadAdminBookings();
      await loadAdminAnalytics();
    }
    notify('Booking confirmed. Email has been sent to secretary@imatnsb-hqgh.com.');
  } catch (error) {
    notify(error.message || 'Booking failed.');
  }
}

async function submitFeedback() {
  if (!feedbackForm.value.bookingId || !feedbackForm.value.note.trim()) {
    notify('Select an active booking and enter feedback.');
    return;
  }

  try {
    await apiSubmitFeedback({
      bookingId: feedbackForm.value.bookingId,
      note: feedbackForm.value.note,
    });

    feedbackForm.value = { bookingId: '', note: '' };
    await loadPublicData();
    if (canViewAdminData.value) {
      await loadAdminBookings();
      await loadAdminAnalytics();
    }
    notify('Feedback saved to database.');
  } catch (error) {
    notify(error.message || 'Unable to save feedback.');
  }
}

async function adminLogin() {
  if (!adminUsername.value || !adminPassword.value) {
    notify('Username and password are required.');
    return;
  }

  try {
    const response = await apiLogin(adminUsername.value, adminPassword.value);
    saveAuth({
      token: response.token,
      role: response.user.role,
      username: response.user.username,
    });
    adminUsername.value = '';
    adminPassword.value = '';
    await Promise.all([loadAdminBookings(), loadAdminAnalytics()]);
    notify(`Logged in as ${response.user.role}.`);
  } catch (error) {
    notify(error.message || 'Login failed.');
  }
}

function adminLogout() {
  clearAuth();
  bookings.value = [];
  analytics.value = {
    summary: { totalBookings: 0, activeBookings: 0, paidRevenue: 0, pendingPayments: 0 },
    bookingsBySpace: [],
    mealDemand: { breakfast: 0, lunch: 0, dinner: 0 },
    monthlyRevenue: [],
  };
  notify('Logged out successfully.');
}

async function submitBlock() {
  if (!isAdmin.value) {
    notify('Only admin can block rooms/halls.');
    return;
  }

  try {
    await apiCreateBlock(auth.value.token, blockForm.value);
    blockForm.value = { eventName: '', spaceId: '', startDateTime: '', endDateTime: '', reason: '' };
    await loadPublicData();
    notify('Event block saved to database.');
  } catch (error) {
    notify(error.message || 'Unable to block slot.');
  }
}

async function removeBlock(blockId) {
  if (!isAdmin.value) {
    notify('Only admin can remove blocked slots.');
    return;
  }

  try {
    await apiDeleteBlock(auth.value.token, blockId);
    await loadPublicData();
    notify('Blocked slot removed.');
  } catch (error) {
    notify(error.message || 'Unable to remove block.');
  }
}

async function cancelBooking(bookingId) {
  if (!isAdmin.value) {
    notify('Only admin can cancel bookings.');
    return;
  }

  try {
    await apiDeleteBooking(auth.value.token, bookingId);
    await Promise.all([loadAdminBookings(), loadAdminAnalytics()]);
    await loadPublicData();
    notify('Booking cancelled by admin.');
  } catch (error) {
    notify(error.message || 'Unable to cancel booking.');
  }
}

function displayDate(input) {
  return new Date(input).toLocaleString();
}

async function requestOtp() {
  try {
    if (
      !guestLoginForm.value.guestName.trim() ||
      !guestLoginForm.value.guestEmail.trim() ||
      !guestLoginForm.value.guestPhone.trim()
    ) {
      notify('Guest name, email and phone are required for OTP.');
      return;
    }

    await apiRequestGuestOtp(guestLoginForm.value);
    otpRequested.value = true;
    notify('OTP sent. Check your email and enter OTP to continue.');
  } catch (error) {
    notify(error.message || 'Unable to generate OTP.');
  }
}

async function verifyOtpAndLogin() {
  try {
    const response = await apiVerifyGuestOtp(guestLoginForm.value);
    saveGuestAuth({
      token: response.token,
      guestName: response.guest.guestName,
      guestEmail: response.guest.guestEmail,
      guestPhone: response.guest.guestPhone,
    });
    await loadGuestBookings();
    notify('Guest login successful.');
  } catch (error) {
    notify(error.message || 'OTP verification failed.');
  }
}

async function loadGuestBookings() {
  if (!guestAuth.value.token) {
    guestBookings.value = [];
    return;
  }

  const response = await apiGetGuestBookings(guestAuth.value.token);
  guestBookings.value = Array.isArray(response?.bookings) ? response.bookings : [];
}

async function downloadInvoice(bookingId) {
  try {
    const blob = await apiDownloadGuestInvoice(guestAuth.value.token, bookingId);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${bookingId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    notify('Invoice downloaded.');
  } catch (error) {
    notify(error.message || 'Unable to download invoice.');
  }
}

function guestLogout() {
  clearGuestAuth();
  guestBookings.value = [];
  otpRequested.value = false;
  notify('Guest logged out.');
}

onMounted(async () => {
  try {
    startBootLoader();
    await loadPublicData();
    if (auth.value.token && canViewAdminData.value) {
      await Promise.all([loadAdminBookings(), loadAdminAnalytics()]);
    }
    if (guestAuth.value.token) {
      await loadGuestBookings();
    }
    startQuoteRotation();
  } catch {
    notify('Unable to reach backend API. Start server and retry.');
  }
});

onUnmounted(() => {
  stopQuoteRotation();
  clearInterval(loadingTimer);
  clearTimeout(toastTimer);
});
</script>

<template>
  <div>
    <transition name="loader-fade" mode="out-in">
      <section v-if="isBootLoading" key="loader" class="boot-loader">
        <div class="loader-card">
          <div class="room-icon">
            <div class="room-fill" :style="{ width: `${loadingProgress}%` }"></div>
            <div class="room-bed"></div>
            <div class="room-pillow"></div>
            <div class="room-lamp"></div>
          </div>
          <p class="loader-title">Preparing Your Stay</p>
          <p class="loader-progress">{{ loadingProgress }}%</p>
        </div>
      </section>
    </transition>

    <div v-if="!isBootLoading" class="app-shell">

      <header class="topbar">
        <div class="nav-container">
          <a href="#" class="brand-wrap" @click.prevent="goToPage('home')">
            <img src="/ima-logo.png" alt="IMA Logo" class="ima-logo" />
            <span>IMA Guesthouse</span>
          </a>

          <nav class="desktop-menu">
            <button class="nav-link" :class="{ active: currentPage === 'home' }" @click="goToPage('home')">Home</button>
            <button class="nav-link" :class="{ active: currentPage === 'booking' }" @click="goToPage('booking')">Book Rooms</button>
            <button class="nav-link" :class="{ active: currentPage === 'guest' }" @click="goToPage('guest')">Guest Portal</button>
            <button class="nav-link" :class="{ active: currentPage === 'gallery' }" @click="goToPage('gallery')">Gallery</button>
            <button class="nav-link" :class="{ active: currentPage === 'contact' }" @click="goToPage('contact')">Contact</button>
            <button class="nav-link" :class="{ active: currentPage === 'admin' }" @click="goToPage('admin')">Admin</button>
          </nav>

          <button class="hamburger-btn" @click="isMenuOpen = !isMenuOpen">
            {{ isMenuOpen ? '✕' : '☰' }}
          </button>
        </div>
      </header>

      <transition name="fade">
        <div v-if="isMenuOpen" class="mobile-menu">
          <button class="mobile-nav-link" @click="goToPage('home')">Home</button>
          <button class="mobile-nav-link" @click="goToPage('booking')">Book Rooms</button>
          <button class="mobile-nav-link" @click="goToPage('guest')">Guest Portal</button>
          <button class="mobile-nav-link" @click="goToPage('gallery')">Gallery</button>
          <button class="mobile-nav-link" @click="goToPage('contact')">Contact</button>
          <button class="mobile-nav-link" @click="goToPage('admin')">Admin</button>
        </div>
      </transition>

      <main class="content">
        <template v-if="currentPage === 'home'">
          <section class="hero">
            <div class="hero-bg" :style="heroBackgroundStyle"></div>
            <div class="hero-overlay"></div>
            <div class="hero-content">
              <h2 class="fade-up">Cinematic Stay.</h2>
              <p class="lead fade-up delay-1">Experience the IMA Premium Guest House. Comfort, redefined.</p>
              <div class="cta-group fade-up delay-2">
                <button class="btn btn-primary" @click="goToPage('booking')">Book Your Stay</button>
                <button class="btn btn-secondary" @click="goToPage('contact')">Contact Desk</button>
              </div>
            </div>
          </section>

          <section class="section fade-up delay-2">
            <div class="panel-head">
              <h3>Room & Hall Preview</h3>
              <p>Select your preferred space and continue with booking.</p>
            </div>
            <transition-group name="room-flow" tag="div" class="space-preview-grid">
              <article v-for="space in inventory" :key="space.id" class="space-preview-card">
                <img :src="space.gallery?.[0] || space.image" :alt="space.name" loading="lazy" />
                <div class="space-preview-content">
                  <h3>{{ space.name }}</h3>
                  <p class="muted">{{ space.type }} · {{ space.capacity }}</p>
                  <p class="space-preview-price">{{ space.rate }}</p>
                </div>
                <button type="button" class="card-book-btn" @click="openSpaceDetails(space)">
                  Book {{ space.type === 'Room' ? 'Room' : 'Hall' }}
                </button>
              </article>
            </transition-group>
          </section>

          <section class="section fade-up delay-3">
            <div class="panel-head">
              <h3>Features</h3>
              <p>Everything you need, nothing you don't.</p>
            </div>
            <div class="grid">
              <article v-for="highlight in homeHighlights" :key="highlight.title" class="card">
                <div class="card-content">
                   <h3>{{ highlight.title }}</h3>
                   <p>{{ highlight.caption }}</p>
                </div>
              </article>
            </div>
          </section>
        </template>

        <template v-else-if="currentPage === 'space'">
          <section class="section fade-up">
          <div v-if="selectedShowcaseSpace" class="space-detail-wrap">
              <div class="panel-head">
                <h3>{{ selectedShowcaseSpace.name }}</h3>
              <p>{{ selectedShowcaseSpace.type }} · {{ selectedShowcaseSpace.capacity }}</p>
            </div>

            <div class="space-meta-row">
              <p><strong>Price:</strong> {{ selectedShowcaseSpace.rate }}</p>
              <p><strong>Type:</strong> {{ selectedShowcaseSpace.type }}</p>
            </div>

            <div class="space-gallery-grid">
              <img
                v-for="(photo, index) in selectedShowcaseSpace.gallery || [selectedShowcaseSpace.image]"
                :key="`${selectedShowcaseSpace.id}-details-${index}`"
                :src="photo"
                :alt="`${selectedShowcaseSpace.name} photo ${index + 1}`"
                loading="lazy"
              />
            </div>

            <div class="space-feature-list">
              <h4>Features</h4>
              <ul>
                <li v-for="feature in selectedShowcaseSpace.features" :key="feature">{{ feature }}</li>
              </ul>
            </div>

            <div class="space-actions">
              <button type="button" class="primary-btn" @click="openBookingPage(selectedShowcaseSpace)">
                Book This {{ selectedShowcaseSpace.type === 'Room' ? 'Room' : 'Hall' }}
              </button>
              <button type="button" class="secondary-btn" @click="goToPage('home')">Back to Home</button>
            </div>
          </div>
        </section>
      </template>

        <template v-else-if="currentPage === 'booking'">
          <section class="section fade-up">
            <div class="panel-head">
              <h3>Booking</h3>
              <p>Reserve your spot.</p>
            </div>

          <form class="booking-form booking-wizard-form" @submit.prevent="submitBooking">
            <div class="wizard-progress-track">
              <div class="wizard-progress-fill" :style="{ width: `${bookingProgress}%` }"></div>
            </div>
            <div class="wizard-meta">
              <strong>Step {{ bookingStep }} of {{ BOOKING_TOTAL_STEPS }}</strong>
              <span>{{ bookingStepLabel }}</span>
            </div>

            <transition name="wizard-step" mode="out-in">
              <section :key="bookingStep" class="wizard-panel">
                <template v-if="bookingStep === 1">
                  <h4>Guest Name</h4>
                  <div class="grid two-col">
                    <label>
                      Guest name
                      <input v-model.trim="bookingForm.guestName" type="text" required />
                    </label>
                  </div>
                </template>

                <template v-else-if="bookingStep === 2">
                  <h4>Guest Number</h4>
                  <div class="grid two-col">
                    <label>
                      Guest phone
                      <input v-model.trim="bookingForm.guestPhone" type="tel" required placeholder="+91 9XXXXXXXXX" />
                    </label>
                  </div>
                </template>

                <template v-else-if="bookingStep === 3">
                  <h4>Government ID Verification</h4>
                  <div class="grid two-col">
                    <label>
                      Guest email
                      <input v-model.trim="bookingForm.guestEmail" type="email" required />
                    </label>
                    <label>
                      Branch
                      <input v-model.trim="bookingForm.branch" type="text" required />
                    </label>
                    <label>
                      Govt ID proof
                      <select v-model="bookingForm.idProofType" required>
                        <option value="">Select</option>
                        <option>Aadhaar</option>
                        <option>PAN</option>
                        <option>Passport</option>
                        <option>Driving License</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <label>
                      Govt ID number
                      <input v-model.trim="bookingForm.idProofNumber" type="text" required />
                    </label>
                  </div>
                </template>

                <template v-else-if="bookingStep === 4">
                  <h4>Choose Your Space</h4>
                  <div class="grid two-col">
                    <label>
                      Hall / room
                      <select v-model="bookingForm.hallOrRoom" required @change="onSpaceTypeChange">
                        <option value="">Select</option>
                        <option value="Room">Room</option>
                        <option value="Conference Hall">Conference Hall</option>
                      </select>
                    </label>

                    <label>
                      Option
                      <select v-model="bookingForm.selectedSpaceId" required>
                        <option value="">Select</option>
                        <option v-for="space in spacesForSelection" :key="space.id" :value="space.id">
                          {{ space.name }}
                        </option>
                      </select>
                    </label>
                  </div>

                  <div class="booking-select-grid">
                    <article
                      v-for="space in bookingChoices"
                      :key="`booking-${space.id}`"
                      class="booking-select-card"
                      :class="{ 'booking-select-card-active': bookingForm.selectedSpaceId === space.id }"
                    >
                      <img :src="space.image" :alt="space.name" loading="lazy" />
                      <div>
                        <strong>{{ space.name }}</strong>
                        <p>{{ space.rate }}</p>
                      </div>
                      <button type="button" class="card-book-btn" @click="selectBookingSpace(space)">
                        Choose {{ space.type === 'Room' ? 'Room' : 'Hall' }}
                      </button>
                    </article>
                  </div>
                </template>

                <template v-else-if="bookingStep === 5">
                  <h4>Stay Preferences</h4>
                  <div class="grid two-col">
                    <label>
                      Checkin date and time
                      <input v-model="bookingForm.checkinDateTime" type="datetime-local" required />
                    </label>

                    <label>
                      Checkout date and time
                      <input v-model="bookingForm.checkoutDateTime" type="datetime-local" required />
                    </label>

                    <label>
                      Food preferences N/NV
                      <select v-model="bookingForm.foodPreference" required>
                        <option value="">Select</option>
                        <option value="N">N (Vegetarian)</option>
                        <option value="NV">NV (Non-Vegetarian)</option>
                      </select>
                    </label>

                    <label>
                      Cab service needed
                      <select v-model="bookingForm.cabService" required>
                        <option value="">Select</option>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </label>
                  </div>

                  <div class="meals-block">
                    <span class="meals-title">Breakfast / Lunch / Dinner</span>
                    <div class="checkbox-row">
                      <label class="meal-option">
                        <input
                          type="checkbox"
                          :checked="bookingForm.meals.includes('Breakfast')"
                          @change="onMealToggle('Breakfast')"
                        />
                        Breakfast
                      </label>
                      <label class="meal-option">
                        <input
                          type="checkbox"
                          :checked="bookingForm.meals.includes('Lunch')"
                          @change="onMealToggle('Lunch')"
                        />
                        Lunch
                      </label>
                      <label class="meal-option">
                        <input
                          type="checkbox"
                          :checked="bookingForm.meals.includes('Dinner')"
                          @change="onMealToggle('Dinner')"
                        />
                        Dinner
                      </label>
                    </div>
                  </div>
                </template>

                <template v-else-if="bookingStep === 6">
                  <h4>Payment Selection</h4>
                  <div class="grid two-col">
                    <label>
                      Payment details
                      <select v-model="bookingForm.paymentMethod" required @change="onPaymentMethodChange">
                        <option value="">Select</option>
                        <option>Google Pay / UPI</option>
                        <option>Pay on Arrival</option>
                      </select>
                    </label>
                  </div>

                  <transition name="slide-fade">
                    <div v-if="bookingForm.paymentMethod === 'Google Pay / UPI'" class="upi-payment-card">
                      <h5>Scan with Google Pay</h5>
                      <img class="upi-qr" :src="upiQrImageUrl" alt="IMA Guesthouse UPI QR Code" loading="lazy" />
                      <p><strong>UPI ID:</strong> {{ UPI_ID }}</p>
                      <p v-if="estimatedAmountInr > 0"><strong>Amount:</strong> INR {{ estimatedAmountInr }}</p>
                      <label>
                        Transaction reference
                        <input
                          v-model.trim="bookingForm.transactionRef"
                          type="text"
                          placeholder="Enter UPI transaction reference"
                          required
                        />
                      </label>
                    </div>
                  </transition>

                  <transition name="slide-fade">
                    <p v-if="bookingForm.paymentMethod === 'Pay on Arrival'" class="pay-note">
                      Guest will complete payment at reception before checkin.
                    </p>
                  </transition>
                </template>

                <template v-else>
                  <h4>Review & Confirm</h4>
                  <div class="list-card booking-review">
                    <p><strong>Guest:</strong> {{ bookingForm.guestName }} · {{ bookingForm.branch }}</p>
                    <p><strong>Contact:</strong> {{ bookingForm.guestPhone }} · {{ bookingForm.guestEmail }}</p>
                    <p><strong>Govt ID:</strong> {{ bookingForm.idProofType }} · {{ bookingForm.idProofNumber }}</p>
                    <p><strong>Space:</strong> {{ selectedSpaceDetails?.name || bookingForm.selectedSpaceId }}</p>
                    <p>
                      <strong>Stay:</strong>
                      {{ bookingForm.checkinDateTime || 'N/A' }} to {{ bookingForm.checkoutDateTime || 'N/A' }}
                    </p>
                    <p><strong>Food:</strong> {{ bookingForm.foodPreference }} · {{ bookingForm.meals.join(', ') }}</p>
                    <p><strong>Cab:</strong> {{ bookingForm.cabService }}</p>
                    <p><strong>Payment:</strong> {{ bookingForm.paymentMethod }}</p>
                    <p v-if="bookingForm.paymentMethod === 'Google Pay / UPI'">
                      <strong>Txn Ref:</strong> {{ bookingForm.transactionRef || 'N/A' }}
                    </p>
                  </div>
                </template>
              </section>
            </transition>

            <div class="wizard-actions">
              <button
                type="button"
                class="secondary-btn"
                :disabled="bookingStep === 1"
                @click="previousBookingStep"
              >
                Back
              </button>
              <button
                v-if="bookingStep < BOOKING_TOTAL_STEPS"
                type="button"
                class="primary-btn"
                @click="nextBookingStep"
              >
                Continue
              </button>
              <button v-else type="submit" class="primary-btn">Confirm booking</button>
            </div>
          </form>

          <section v-if="selectedSpaceDetails" class="room-gallery">
            <div class="panel-head">
              <h3>{{ selectedSpaceDetails.name }} Photos</h3>
              <p>Preview your selected {{ selectedSpaceDetails.type.toLowerCase() }} before confirming.</p>
            </div>
            <div class="room-gallery-grid">
              <img
                v-for="(photo, index) in selectedSpaceDetails.gallery || [selectedSpaceDetails.image]"
                :key="`${selectedSpaceDetails.id}-${index}`"
                :src="photo"
                :alt="`${selectedSpaceDetails.name} view ${index + 1}`"
                loading="lazy"
              />
            </div>
          </section>
        </section>

        <section class="panel fade-up delay-2">
          <div class="panel-head">
            <h3>Pre-checkout Feedback</h3>
            <p>Active bookings are loaded from the database.</p>
          </div>

          <form class="feedback-form" @submit.prevent="submitFeedback">
            <label>
              Active booking
              <select v-model="feedbackForm.bookingId" required>
                <option value="">Select</option>
                <option v-for="booking in activeBookings" :key="booking.id" :value="booking.id">
                  {{ booking.guestName }} - {{ booking.selectedSpaceLabel }}
                </option>
              </select>
            </label>

            <label>
              What service can be improved?
              <textarea
                v-model.trim="feedbackForm.note"
                rows="4"
                placeholder="Housekeeping, meal quality, cab punctuality, reception support..."
                required
              ></textarea>
            </label>

            <button class="secondary-btn" type="submit">Save feedback</button>
          </form>
        </section>
      </template>

      <template v-else-if="currentPage === 'guest'">
        <section class="section fade-up">
          <div class="panel-head">
            <h3>Guest Portal</h3>
            <p>Login with OTP to view booking history and download invoices.</p>
          </div>

          <div v-if="!isGuestLoggedIn" class="admin-login">
            <label>
              Guest name
              <input v-model.trim="guestLoginForm.guestName" type="text" />
            </label>
            <label>
              Guest email
              <input v-model.trim="guestLoginForm.guestEmail" type="email" />
            </label>
            <label>
              Guest phone
              <input v-model.trim="guestLoginForm.guestPhone" type="tel" />
            </label>
            <button type="button" class="primary-btn" @click="requestOtp">Request OTP</button>

            <label v-if="otpRequested">
              Enter OTP
              <input v-model.trim="guestLoginForm.otpCode" type="text" />
            </label>
            <button v-if="otpRequested" type="button" class="secondary-btn" @click="verifyOtpAndLogin">
              Verify OTP & Login
            </button>
          </div>

          <template v-else>
            <div class="admin-head-actions">
              <p class="muted">
                Logged in as {{ guestAuth.guestName }} · {{ guestAuth.guestPhone }}
              </p>
              <button type="button" class="secondary-btn" @click="guestLogout">Logout</button>
            </div>

            <section class="admin-section">
              <h4>Your Booking History</h4>
              <div class="simple-list">
                <article v-for="booking in guestBookings" :key="booking.id" class="list-card">
                  <strong>{{ booking.id }} · {{ booking.selectedSpaceLabel }}</strong>
                  <p>{{ displayDate(booking.checkinDateTime) }} to {{ displayDate(booking.checkoutDateTime) }}</p>
                  <p>Amount: INR {{ booking.totalAmount }} · Payment: {{ booking.paymentStatus }}</p>
                  <button type="button" class="primary-btn" @click="downloadInvoice(booking.id)">
                    Download Invoice
                  </button>
                </article>
                <p v-if="guestBookings.length === 0" class="muted">No bookings found for your profile.</p>
              </div>
            </section>
          </template>
        </section>
      </template>

      <template v-else-if="currentPage === 'gallery'">
        <section class="section fade-up">
          <div class="panel-head">
            <h3>Gallery</h3>
            <p>Moments from our guesthouse.</p>
          </div>
          <div class="gallery-grid">
            <article v-for="item in galleryItems" :key="item.id" class="gallery-card">
              <div class="image-wrap">
                <img :src="item.photo" :alt="item.name" loading="lazy" />
              </div>
              <p>{{ item.name }}</p>
            </article>
          </div>
        </section>
      </template>

      <template v-else-if="currentPage === 'contact'">
        <section class="section fade-up">
          <div class="panel-head">
            <h3>Contact Us</h3>
            <p>We're here to help.</p>
          </div>
          <div class="grid two-col">
            <div class="contact-card">
              <h3>Secretary Desk</h3>
              <p>+91 96050 11223</p>
              <p>secretary@imatnsb-hqgh.com</p>
              <p>Available 24/7 for booking and event support</p>
            </div>
            <div class="contact-card">
              <h3>IMA TNSB Headquarters</h3>
              <p>IMA State Guesthouse, TNSB HQ Campus</p>
              <p>Thiruvananthapuram, Kerala</p>
              <a
                class="map-link"
                href="https://maps.google.com/?q=IMA+TNSB+Headquarters"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          </div>

          <section class="location-wrap">
            <div class="panel-head">
              <h3>Live Location Map</h3>
              <p>Use this map view to navigate to the guesthouse.</p>
            </div>
            <div class="map-frame">
              <iframe
                title="IMA Guesthouse location map"
                src="https://www.google.com/maps?q=IMA%20TNSB%20Headquarters&output=embed"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="currentPage === 'admin'">
        <section class="section fade-up">
          <div class="panel-head">
            <h3>Administration</h3>
            <p>Manage bookings and inventory.</p>
          </div>

          <div v-if="!auth.token" class="admin-login">
            <label>
              Username
              <input v-model.trim="adminUsername" type="text" placeholder="admin" />
            </label>
            <label>
              Password
              <input v-model.trim="adminPassword" type="password" placeholder="Enter password" />
            </label>
            <button type="button" class="primary-btn" @click="adminLogin">Login</button>
            <p class="muted small">Default users: admin / Admin@123, manager / Manager@123</p>
          </div>

          <template v-else>
            <div class="admin-head-actions">
              <p class="muted">
                User: {{ auth.username }} ({{ auth.role }}) · Total bookings: {{ bookings.length }} · Active blocks:
                {{ activeBlockCount }}
              </p>
              <button type="button" class="secondary-btn" @click="adminLogout">Logout</button>
            </div>

            <section class="admin-section analytics-section">
              <h4>Live Analytics</h4>
              <div class="grid analytics-cards">
                <article class="card">
                  <div class="card-content">
                    <h3>{{ analytics.summary.totalBookings }}</h3>
                    <p>Total Bookings</p>
                  </div>
                </article>
                <article class="card">
                  <div class="card-content">
                    <h3>{{ analytics.summary.activeBookings }}</h3>
                    <p>Active Bookings</p>
                  </div>
                </article>
                <article class="card">
                  <div class="card-content">
                    <h3>INR {{ analytics.summary.paidRevenue }}</h3>
                    <p>Revenue (Paid)</p>
                  </div>
                </article>
                <article class="card">
                  <div class="card-content">
                    <h3>{{ analytics.summary.pendingPayments }}</h3>
                    <p>Pending Payments</p>
                  </div>
                </article>
              </div>
              <div class="grid analytics-cards">
                <article class="list-card">
                  <strong>Bookings by Space</strong>
                  <p
                    v-for="item in analytics.bookingsBySpace"
                    :key="`space-${item.label}`"
                  >
                    {{ item.label }}: {{ item.count }}
                  </p>
                </article>
                <article class="list-card">
                  <strong>Meal Demand</strong>
                  <p>Breakfast: {{ analytics.mealDemand.breakfast }}</p>
                  <p>Lunch: {{ analytics.mealDemand.lunch }}</p>
                  <p>Dinner: {{ analytics.mealDemand.dinner }}</p>
                </article>
              </div>
            </section>

            <div class="admin-grid">
              <section class="admin-section">
                <h4>Block Room/Hall For Event</h4>
                <form class="booking-form" @submit.prevent="submitBlock">
                  <label>
                    Event name
                    <input v-model.trim="blockForm.eventName" type="text" required :disabled="!isAdmin" />
                  </label>
                  <label>
                    Space
                    <select v-model="blockForm.spaceId" required :disabled="!isAdmin">
                      <option value="">Select</option>
                      <option v-for="item in inventory" :key="item.id" :value="item.id">
                        {{ item.name }}
                      </option>
                    </select>
                  </label>
                  <label>
                    Start date & time
                    <input v-model="blockForm.startDateTime" type="datetime-local" required :disabled="!isAdmin" />
                  </label>
                  <label>
                    End date & time
                    <input v-model="blockForm.endDateTime" type="datetime-local" required :disabled="!isAdmin" />
                  </label>
                  <label>
                    Reason
                    <textarea v-model.trim="blockForm.reason" rows="3" required :disabled="!isAdmin"></textarea>
                  </label>
                  <button type="submit" class="primary-btn" :disabled="!isAdmin">Save block</button>
                </form>
                <p v-if="!isAdmin" class="muted small">Only admin role can create/remove blocks and cancel bookings.</p>
              </section>

              <section class="admin-section">
                <h4>Blocked Slots</h4>
                <div class="simple-list">
                  <article v-for="block in blockedSlots" :key="block.id" class="list-card">
                    <strong>{{ block.eventName }} · {{ block.spaceLabel }}</strong>
                    <p>{{ displayDate(block.startDateTime) }} to {{ displayDate(block.endDateTime) }}</p>
                    <p>Reason: {{ block.reason }}</p>
                    <button
                      type="button"
                      class="danger-btn"
                      :disabled="!isAdmin"
                      @click="removeBlock(block.id)"
                    >
                      Remove block
                    </button>
                  </article>
                  <p v-if="blockedSlots.length === 0" class="muted">No blocked slots.</p>
                </div>
              </section>
            </div>

            <section v-if="canViewAdminData" class="admin-section">
              <h4>Manage Bookings</h4>
              <div class="bookings-wrap">
                <BookingCard
                  v-for="booking in bookings"
                  :key="booking.id"
                  :booking="booking"
                  :display-date="displayDate"
                  :show-actions="isAdmin"
                  @cancel-booking="cancelBooking"
                />
                <p v-if="bookings.length === 0" class="muted">No bookings available.</p>
              </div>
            </section>
          </template>
        </section>
      </template>
      </main>

      <transition name="slide-fade">
        <aside v-if="toast" class="toast">{{ toast }}</aside>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import PropertyCard from './components/PropertyCard.vue';
import BookingCard from './components/BookingCard.vue';
import {
  apiCreateBlock,
  apiCreateBooking,
  apiDeleteBlock,
  apiDeleteBooking,
  apiGetActiveBookings,
  apiGetAdminBookings,
  apiGetBlockedSlots,
  apiGetInventory,
  apiLogin,
  apiSubmitFeedback,
} from './api.js';

const currentPage = ref('home');
const inventory = ref([]);
const bookings = ref([]);
const blockedSlots = ref([]);
const activeBookings = ref([]);
const selectedShowcaseSpace = ref(null);

const auth = ref(loadAuth());
const adminUsername = ref('');
const adminPassword = ref('');

const bookingForm = ref(getEmptyBookingForm());
const feedbackForm = ref({ bookingId: '', note: '' });
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

const activeQuote = computed(() => homeQuotes[currentQuoteIndex.value]);
const heroBackgroundStyle = computed(() => ({
  backgroundImage: `url(${inventory.value[0]?.image || ''})`,
}));

function getEmptyBookingForm() {
  return {
    guestName: '',
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
    upiId: '',
    transactionRef: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
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

function notify(message) {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = '';
  }, 2600);
}

function goToPage(page) {
  currentPage.value = page;
}

function openSpaceDetails(space) {
  selectedShowcaseSpace.value = space;
  currentPage.value = 'space';
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

function featureCode(index) {
  return `0${index + 1}`;
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
  bookingForm.value.upiId = '';
  bookingForm.value.transactionRef = '';
  bookingForm.value.cardName = '';
  bookingForm.value.cardNumber = '';
  bookingForm.value.cardExpiry = '';
  bookingForm.value.cardCvv = '';
}

function onPaymentMethodChange() {
  resetPaymentDetails();
}

function maskedCard(cardNumber) {
  return cardNumber.replace(/.(?=.{4})/g, '*');
}

function openBookingPage(space) {
  currentPage.value = 'booking';
  if (space) {
    bookingForm.value.hallOrRoom = space.type;
    bookingForm.value.selectedSpaceId = space.id;
  }
}

function validateBooking() {
  const checkin = new Date(bookingForm.value.checkinDateTime).getTime();
  const checkout = new Date(bookingForm.value.checkoutDateTime).getTime();

  if (!Number.isFinite(checkin) || !Number.isFinite(checkout) || checkout <= checkin) {
    notify('Checkout must be after checkin date/time.');
    return false;
  }

  if (!bookingForm.value.meals.length) {
    notify('Select at least one meal: breakfast, lunch, or dinner.');
    return false;
  }

  if (bookingForm.value.paymentMethod === 'Google Pay / UPI' && !bookingForm.value.upiId.trim()) {
    notify('UPI ID is required for Google Pay / UPI.');
    return false;
  }

  if (bookingForm.value.paymentMethod === 'Card / Credit') {
    if (!bookingForm.value.cardName.trim() || !bookingForm.value.cardNumber.trim()) {
      notify('Card holder name and card number are required.');
      return false;
    }
  }

  return true;
}

async function loadPublicData() {
  const [inventoryResponse, blocksResponse, activeResponse] = await Promise.all([
    apiGetInventory(),
    apiGetBlockedSlots(),
    apiGetActiveBookings(),
  ]);
  inventory.value = inventoryResponse.inventory;
  blockedSlots.value = blocksResponse.blockedSlots;
  activeBookings.value = activeResponse.bookings;
}

async function loadAdminBookings() {
  if (!auth.value.token || !canViewAdminData.value) {
    bookings.value = [];
    return;
  }

  const response = await apiGetAdminBookings(auth.value.token);
  bookings.value = response.bookings;
}

async function submitBooking() {
  if (!validateBooking()) return;

  const paymentDetails =
    bookingForm.value.paymentMethod === 'Google Pay / UPI'
      ? {
          upiId: bookingForm.value.upiId,
          transactionRef: bookingForm.value.transactionRef,
        }
      : bookingForm.value.paymentMethod === 'Card / Credit'
        ? {
            cardHolder: bookingForm.value.cardName,
            cardNumberMasked: maskedCard(bookingForm.value.cardNumber),
            cardExpiry: bookingForm.value.cardExpiry,
          }
        : {
            status: 'Pay at reception before checkin',
          };

  try {
    await apiCreateBooking({
      guestName: bookingForm.value.guestName,
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
    await loadPublicData();
    if (canViewAdminData.value) {
      await loadAdminBookings();
    }
    notify('Booking saved to database successfully.');
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
    await loadAdminBookings();
    notify(`Logged in as ${response.user.role}.`);
  } catch (error) {
    notify(error.message || 'Login failed.');
  }
}

function adminLogout() {
  clearAuth();
  bookings.value = [];
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
    await loadAdminBookings();
    await loadPublicData();
    notify('Booking cancelled by admin.');
  } catch (error) {
    notify(error.message || 'Unable to cancel booking.');
  }
}

function displayDate(input) {
  return new Date(input).toLocaleString();
}

onMounted(async () => {
  try {
    startBootLoader();
    await loadPublicData();
    if (auth.value.token && canViewAdminData.value) {
      await loadAdminBookings();
    }
    startQuoteRotation();
  } catch {
    notify('Unable to reach backend API. Start server and retry.');
  }
});

onUnmounted(() => {
  stopQuoteRotation();
  clearInterval(loadingTimer);
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
      <div class="orb orb-one"></div>
      <div class="orb orb-two"></div>

      <header class="topbar fade-up">
      <transition name="fade-brand" mode="out-in">
        <a href="#" :key="`brand-${currentPage === 'home' ? 'home' : 'inner'}`" class="brand-wrap" @click.prevent="goToPage('home')">
          <img src="/ima-logo.png" alt="Indian Medical Association logo" class="ima-logo" />
          <div class="brand-text">
            <p class="eyebrow">Indian Medical Association</p>
            <h1>Guesthouse</h1>
          </div>
        </a>
      </transition>
      <div class="top-actions menu-bar">
        <button
          type="button"
          class="anchor-btn menu-btn"
          :class="{ 'menu-btn-active': currentPage === 'home' }"
          @click="goToPage('home')"
        >
          Home
        </button>
        <button
          type="button"
          class="anchor-btn menu-btn"
          :class="{ 'menu-btn-active': currentPage === 'booking' }"
          @click="goToPage('booking')"
        >
          Book Rooms
        </button>
        <button
          type="button"
          class="anchor-btn menu-btn"
          :class="{ 'menu-btn-active': currentPage === 'gallery' }"
          @click="goToPage('gallery')"
        >
          Gallery
        </button>
        <button
          type="button"
          class="anchor-btn menu-btn"
          :class="{ 'menu-btn-active': currentPage === 'contact' }"
          @click="goToPage('contact')"
        >
          Contact
        </button>
        <button
          type="button"
          class="anchor-btn menu-btn"
          :class="{ 'menu-btn-active': currentPage === 'admin' }"
          @click="goToPage('admin')"
        >
          Admin
        </button>
      </div>
      </header>

      <main class="content">
      <template v-if="currentPage === 'home'">
        <section class="hero fade-up delay-1">
          <div class="hero-banner" :style="heroBackgroundStyle">
            <div class="hero-content">
              <span class="hero-eyebrow">IMA Premium Guest House</span>
              <h2 class="hero-title-fade">Rest & Recharge in Luxury.</h2>
              <transition name="fade-quote" mode="out-in">
                <p :key="currentQuoteIndex" class="quote-line">{{ activeQuote }}</p>
              </transition>
              <p class="hero-copy hero-copy-fade">
                Experience world-class comfort tailored for medical professionals. 
                Whether you're here for a conference or a getaway, we ensure your stay is flawless.
              </p>
              <div class="hero-cta-row">
                <button type="button" class="primary-btn" @click="goToPage('booking')">Book Now</button>
                <button type="button" class="secondary-btn" @click="goToPage('gallery')">View Gallery</button>
              </div>
            </div>
          </div>
        </section>

        <section class="panel fade-up delay-2">
          <div class="panel-head">
            <h3>Exclusive Accommodations</h3>
            <p>Choose from our meticulously designed rooms and conference spaces.</p>
          </div>
          <!-- Home Photos Grid replaced by Inventory Grid for better flow -->
        </section>

        <section class="inventory-grid fade-up delay-2">
          <PropertyCard v-for="item in inventory" :key="item.id" :item="item" @book="openSpaceDetails" />
        </section>

        <section class="panel fade-up delay-3">
          <div class="panel-head">
            <h3>Why Choose Us?</h3>
            <p>Curated services designed around the needs of the medical community.</p>
          </div>
          <div class="highlights-grid">
            <article
              v-for="(highlight, index) in homeHighlights"
              :key="highlight.title"
              class="highlight-card"
            >
              <span class="highlight-index">{{ featureCode(index) }}</span>
              <div class="highlight-content">
                <span class="highlight-tag">{{ highlight.tag }}</span>
                <h4>{{ highlight.title }}</h4>
                <p>{{ highlight.caption }}</p>
              </div>
            </article>
          </div>
        </section>
      </template>

      <template v-else-if="currentPage === 'space'">
        <section class="panel fade-up delay-1">
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
        <section class="panel fade-up delay-1">
          <div class="panel-head">
            <h3>Booking Details Page</h3>
            <p>Select your room/hall first, then complete guest details.</p>
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

          <form class="booking-form" @submit.prevent="submitBooking">
            <div class="grid two-col">
              <label>
                Guest name
                <input v-model.trim="bookingForm.guestName" type="text" required />
              </label>

              <label>
                Branch
                <input v-model.trim="bookingForm.branch" type="text" required />
              </label>

              <label>
                Id proof
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
                Id proof number
                <input v-model.trim="bookingForm.idProofNumber" type="text" required />
              </label>

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

              <div class="meals-block">
                <span>Breakfast / lunch / dinner</span>
                <div class="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      :checked="bookingForm.meals.includes('Breakfast')"
                      @change="onMealToggle('Breakfast')"
                    />
                    Breakfast
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      :checked="bookingForm.meals.includes('Lunch')"
                      @change="onMealToggle('Lunch')"
                    />
                    Lunch
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      :checked="bookingForm.meals.includes('Dinner')"
                      @change="onMealToggle('Dinner')"
                    />
                    Dinner
                  </label>
                </div>
              </div>

              <label>
                Payment details
                <select v-model="bookingForm.paymentMethod" required @change="onPaymentMethodChange">
                  <option value="">Select</option>
                  <option>Google Pay / UPI</option>
                  <option>Card / Credit</option>
                  <option>Pay on Arrival</option>
                </select>
              </label>
            </div>

            <transition name="slide-fade">
              <div v-if="bookingForm.paymentMethod === 'Google Pay / UPI'" class="grid pay-grid">
                <label>
                  UPI ID
                  <input v-model.trim="bookingForm.upiId" type="text" placeholder="example@okbank" required />
                </label>
                <label>
                  Transaction reference
                  <input
                    v-model.trim="bookingForm.transactionRef"
                    type="text"
                    placeholder="Optional before payment"
                  />
                </label>
              </div>
            </transition>

            <transition name="slide-fade">
              <div v-if="bookingForm.paymentMethod === 'Card / Credit'" class="grid pay-grid">
                <label>
                  Card holder name
                  <input v-model.trim="bookingForm.cardName" type="text" required />
                </label>
                <label>
                  Card number
                  <input v-model.trim="bookingForm.cardNumber" type="text" minlength="12" maxlength="19" required />
                </label>
                <label>
                  Expiry (MM/YY)
                  <input v-model.trim="bookingForm.cardExpiry" type="text" placeholder="MM/YY" required />
                </label>
                <label>
                  CVV
                  <input
                    v-model.trim="bookingForm.cardCvv"
                    type="password"
                    minlength="3"
                    maxlength="4"
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

            <button type="submit" class="primary-btn">Confirm booking</button>
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

      <template v-else-if="currentPage === 'gallery'">
        <section class="panel fade-up delay-1">
          <div class="panel-head">
            <h3>Gallery</h3>
            <p>Explore rooms and hall ambience before your booking.</p>
          </div>
          <div class="gallery-grid">
            <article v-for="item in galleryItems" :key="item.id" class="gallery-card">
              <img :src="item.photo" :alt="item.name" loading="lazy" />
              <p>{{ item.name }}</p>
            </article>
          </div>
        </section>
      </template>

      <template v-else-if="currentPage === 'contact'">
        <section class="panel fade-up delay-1">
          <div class="panel-head">
            <h3>Contact</h3>
            <p>Reach the guesthouse desk for bookings, support, and event coordination.</p>
          </div>

          <div class="contact-grid">
            <article class="contact-card">
              <h4>IMA Guesthouse Front Desk</h4>
              <p>Phone: +91 44 4000 1234</p>
              <p>Email: stay@ima-guesthouse.org</p>
              <p>Hours: 24/7 support</p>
            </article>
            <article class="contact-card">
              <h4>Address</h4>
              <p>IMA Guesthouse & Event Hall</p>
              <p>Anna Salai, Thousand Lights</p>
              <p>Chennai, Tamil Nadu 600006</p>
              <a
                class="map-link"
                href="https://maps.google.com/?q=Indian+Medical+Association+Chennai"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps
              </a>
            </article>
          </div>

          <section class="location-wrap">
            <div class="panel-head">
              <h3>Location</h3>
              <p>View the guesthouse location below.</p>
            </div>
            <div class="map-frame">
              <iframe
                title="IMA Guesthouse location map"
                src="https://www.google.com/maps?q=Indian%20Medical%20Association%20Chennai&output=embed"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="currentPage === 'admin'">
        <section class="panel fade-up delay-1">
          <div class="panel-head">
            <h3>Admin Dashboard</h3>
            <p>Role-based access for events, room blocks, and bookings.</p>
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

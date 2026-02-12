const inventory = [
  {
    id: "R101",
    type: "Room",
    name: "Deluxe Room",
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
    features: ["King bed", "AC & Wi-Fi", "Medical-safe hygiene"],
  },
  {
    id: "R204",
    type: "Room",
    name: "Executive Twin",
    img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    features: ["Twin beds", "Work desk", "Complimentary breakfast"],
  },
  {
    id: "H01",
    type: "Conference Hall",
    name: "IMA Conference Hall",
    img: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    features: ["120 seats", "AV setup", "Tea/Coffee counter"],
  },
];

const bookingKey = "imaBookings";

const inventoryEl = document.getElementById("inventory");
const spaceTypeEl = document.getElementById("spaceType");
const spaceNameEl = document.getElementById("spaceName");
const paymentMethodEl = document.getElementById("paymentMethod");
const paymentFieldsEl = document.getElementById("paymentFields");
const bookingForm = document.getElementById("bookingForm");
const bookingsList = document.getElementById("bookingsList");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackBookingEl = document.getElementById("feedbackBooking");
const toastEl = document.getElementById("toast");

function readBookings() {
  try {
    return JSON.parse(localStorage.getItem(bookingKey)) || [];
  } catch {
    return [];
  }
}

function saveBookings(data) {
  localStorage.setItem(bookingKey, JSON.stringify(data));
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function renderInventory() {
  inventoryEl.innerHTML = inventory
    .map(
      (item) => `
      <article class="card">
        <img src="${item.img}" alt="${item.name}" />
        <div class="card-body">
          <h3>${item.name}</h3>
          <p>${item.type}</p>
          <ul>
            ${item.features.map((f) => `<li>${f}</li>`).join("")}
          </ul>
        </div>
      </article>
    `
    )
    .join("");
}

function updateSpaceOptions() {
  const type = spaceTypeEl.value;
  if (!type) {
    spaceNameEl.innerHTML = '<option value="">Choose hall/room first</option>';
    return;
  }

  const filtered = inventory.filter((i) => i.type === type);
  spaceNameEl.innerHTML =
    '<option value="">Select</option>' +
    filtered.map((i) => `<option value="${i.id}">${i.name}</option>`).join("");
}

function renderPaymentFields() {
  const method = paymentMethodEl.value;
  if (method === "Google Pay / UPI") {
    paymentFieldsEl.innerHTML = `
      <label>
        UPI ID
        <input type="text" name="upiId" placeholder="example@okbank" required />
      </label>
      <label>
        Transaction Reference
        <input type="text" name="txnRef" placeholder="Optional until payment" />
      </label>
    `;
    return;
  }

  if (method === "Card") {
    paymentFieldsEl.innerHTML = `
      <label>
        Card Holder Name
        <input type="text" name="cardHolder" required />
      </label>
      <label>
        Card Number
        <input type="text" name="cardNumber" minlength="12" maxlength="19" required />
      </label>
      <label>
        Expiry (MM/YY)
        <input type="text" name="cardExpiry" placeholder="MM/YY" required />
      </label>
      <label>
        CVV
        <input type="password" name="cardCvv" minlength="3" maxlength="4" required />
      </label>
    `;
    return;
  }

  if (method === "Pay on Arrival") {
    paymentFieldsEl.innerHTML = `
      <p class="sub-note">Payment will be collected at check-in before key/hall handover.</p>
    `;
    return;
  }

  paymentFieldsEl.innerHTML = "";
}

function formatDate(dt) {
  return new Date(dt).toLocaleString();
}

function isActiveBooking(booking) {
  return new Date(booking.checkOut).getTime() > Date.now();
}

function renderBookings() {
  const bookings = readBookings();
  if (!bookings.length) {
    bookingsList.innerHTML = "<p>No bookings yet.</p>";
  } else {
    bookingsList.innerHTML = bookings
      .map(
        (b) => `
      <article class="booking-item">
        <strong>${b.guestName} (${b.branch})</strong>
        <p class="sub">${b.spaceType}: ${b.spaceNameLabel}</p>
        <p>Check-in: ${formatDate(b.checkIn)} | Check-out: ${formatDate(b.checkOut)}</p>
        <p>Food: ${b.foodType} | Meals: ${b.meals.length ? b.meals.join(", ") : "None"}</p>
        <p>Cab: ${b.cabService} | Payment: ${b.paymentMethod}</p>
        <p>Feedback: ${b.feedback || "Not submitted"}</p>
      </article>
    `
      )
      .join("");
  }

  const active = bookings.filter(isActiveBooking);
  feedbackBookingEl.innerHTML =
    '<option value="">Select active booking</option>' +
    active
      .map((b) => `<option value="${b.id}">${b.guestName} - ${b.spaceNameLabel}</option>`)
      .join("");
}

function collectPaymentDetails(formData) {
  const method = formData.get("paymentMethod");

  if (method === "Google Pay / UPI") {
    return {
      upiId: formData.get("upiId")?.trim() || "",
      txnRef: formData.get("txnRef")?.trim() || "",
    };
  }

  if (method === "Card") {
    return {
      cardHolder: formData.get("cardHolder")?.trim() || "",
      cardNumberMasked: (formData.get("cardNumber") || "").replace(/.(?=.{4})/g, "*"),
      cardExpiry: formData.get("cardExpiry")?.trim() || "",
    };
  }

  return {
    mode: "Collect at check-in",
  };
}

function validateDates(checkIn, checkOut) {
  const inTs = new Date(checkIn).getTime();
  const outTs = new Date(checkOut).getTime();
  return Number.isFinite(inTs) && Number.isFinite(outTs) && outTs > inTs;
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(bookingForm);
  const checkIn = formData.get("checkIn");
  const checkOut = formData.get("checkOut");

  if (!validateDates(checkIn, checkOut)) {
    showToast("Check-out must be after check-in.");
    return;
  }

  const spaceId = formData.get("spaceName");
  const space = inventory.find((i) => i.id === spaceId);
  const meals = formData.getAll("meal");

  const booking = {
    id: `BK${Date.now()}`,
    guestName: formData.get("guestName")?.trim(),
    branch: formData.get("branch")?.trim(),
    idProofType: formData.get("idProofType"),
    idProofNumber: formData.get("idProofNumber")?.trim(),
    idProofFileName: formData.get("idProofFile")?.name || "",
    paymentMethod: formData.get("paymentMethod"),
    paymentDetails: collectPaymentDetails(formData),
    spaceType: formData.get("spaceType"),
    spaceName: spaceId,
    spaceNameLabel: space ? space.name : spaceId,
    checkIn,
    checkOut,
    foodType: formData.get("foodType"),
    meals,
    cabService: formData.get("cabService"),
    feedback: "",
    createdAt: new Date().toISOString(),
  };

  const bookings = readBookings();
  bookings.unshift(booking);
  saveBookings(bookings);

  bookingForm.reset();
  spaceNameEl.innerHTML = '<option value="">Choose hall/room first</option>';
  paymentFieldsEl.innerHTML = "";

  renderBookings();
  showToast("Booking confirmed.");
});

feedbackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(feedbackForm);

  const bookingId = formData.get("bookingId");
  const feedbackText = formData.get("feedbackText")?.trim();
  if (!bookingId || !feedbackText) {
    showToast("Select a booking and enter feedback.");
    return;
  }

  const bookings = readBookings();
  const match = bookings.find((b) => b.id === bookingId);

  if (!match) {
    showToast("Booking not found.");
    return;
  }

  if (!isActiveBooking(match)) {
    showToast("Feedback allowed only before checkout.");
    return;
  }

  match.feedback = feedbackText;
  saveBookings(bookings);
  feedbackForm.reset();
  renderBookings();
  showToast("Feedback saved.");
});

spaceTypeEl.addEventListener("change", updateSpaceOptions);
paymentMethodEl.addEventListener("change", renderPaymentFields);

renderInventory();
renderBookings();

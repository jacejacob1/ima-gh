<script setup>
defineProps({
  booking: {
    type: Object,
    required: true,
  },
  displayDate: {
    type: Function,
    required: true,
  },
  showActions: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['cancel-booking']);
</script>

<template>
  <article class="booking-card">
    <strong>{{ booking.guestName }} · {{ booking.branch }}</strong>
    <p class="muted">{{ booking.hallOrRoom }}: {{ booking.selectedSpaceLabel }}</p>
    <p>
      Checkin: {{ displayDate(booking.checkinDateTime) }}<br />
      Checkout: {{ displayDate(booking.checkoutDateTime) }}
    </p>
    <p>
      Food: {{ booking.foodPreference }} · Meals:
      {{ booking.meals.join(', ') }}
    </p>
    <p>Cab: {{ booking.cabService }} · Payment: {{ booking.paymentMethod }}</p>
    <p>Feedback: {{ booking.feedback || 'Not submitted' }}</p>

    <button
      v-if="showActions"
      class="danger-btn"
      type="button"
      @click="emit('cancel-booking', booking.id)"
    >
      Cancel Booking
    </button>
  </article>
</template>

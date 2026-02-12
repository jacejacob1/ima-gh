<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['book']);

function handleBook() {
  emit('book', props.item);
}
</script>

<template>
  <article class="property-card">
    <div class="image-wrap">
      <img :src="item.image" :alt="item.name" loading="lazy" />
      <span class="pill">{{ item.type }}</span>
    </div>
    <div class="body">
      <h3>{{ item.name }}</h3>
      <p>{{ item.capacity }} · {{ item.rate }}</p>
      <ul>
        <li v-for="feature in item.features" :key="feature">{{ feature }}</li>
      </ul>
      <button class="card-book-btn" type="button" @click="handleBook">
        {{ item.type === 'Room' ? 'Book Room' : 'Book Hall' }}
      </button>
    </div>
  </article>
</template>

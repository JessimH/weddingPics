<script setup>
import FileUploader from '../components/FileUploader.vue'

// Date du mariage (à ajuster selon vos besoins)
const eventDate = '2025-07-05'
</script>

<template>
  <main class="home">
    <div class="title-container">
      <h1 class="calligraphy-title">Inès & Reyane</h1>
    </div>
    <FileUploader :eventDate="eventDate" />
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #fff5f7;
}

.title-container {
  margin-bottom: 40px;
  text-align: center;
}

.calligraphy-title {
  font-family: 'Playfair Display', serif;
  font-size: 3.5rem;
  color: var(--wedding-dark);
  margin: 0;
  letter-spacing: 2px;
  position: relative;
  display: inline-block;
}
/*
.calligraphy-title::before,
.calligraphy-title::after {
  content: '❀';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  color: var(--wedding-primary);
  opacity: 0.8;
} */

.calligraphy-title::before {
  left: -40px;
}

.calligraphy-title::after {
  right: -40px;
}

@media (max-width: 768px) {
  .calligraphy-title {
    font-size: 2.5rem;
  }

  .calligraphy-title::before {
    left: -30px;
  }

  .calligraphy-title::after {
    right: -30px;
  }
}
</style>

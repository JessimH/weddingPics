<script setup>
import FileUploader from '../components/FileUploader.vue'

// Date du mariage (à ajuster selon vos besoins)
const eventDate = '2025-07-05'
</script>

<template>
  <main class="home">
    <FileUploader :eventDate="eventDate" />
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>

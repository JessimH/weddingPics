<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
body {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  background-color: var(--wedding-light);
  color: var(--wedding-dark);
}

h1,
h2,
h3 {
  font-family: 'Playfair Display', serif;
  font-weight: 500;
}

button {
  background-color: var(--wedding-primary);
  color: var(--wedding-dark);
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-family: 'Cormorant Garamond', serif;
  transition: all 0.3s ease;
}

button:hover {
  background-color: var(--wedding-accent);
  color: var(--wedding-light);
}

/* Ajout de décorations florales */
.wedding-decorator {
  position: fixed;
  width: 200px;
  height: 200px;
  opacity: 0.1;
  background-image: url('/floral-corner.png');
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
}

.decorator-top-left {
  top: 0;
  left: 0;
  transform: rotate(0deg);
}

.decorator-bottom-right {
  bottom: 0;
  right: 0;
  transform: rotate(180deg);
}
</style>

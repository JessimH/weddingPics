<script setup>
import { ref } from 'vue'
import { useUploadStore } from '@/stores/upload'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

defineProps({
  eventDate: {
    type: String,
    required: true,
  },
})

const uploadStore = useUploadStore()
const fileInput = ref(null)
const isDragging = ref(false)

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  uploadStore.addFiles(files)
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  uploadStore.addFiles(files)
}

const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
}

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}
</script>

<template>
  <div class="uploader">
    <h1>Partagez vos photos et vidéos</h1>
    <p class="event-date">Date du mariage : {{ formatDate(eventDate) }}</p>

    <div
      class="upload-zone"
      :class="{ dragging: isDragging }"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="$refs.fileInput.click()"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,video/*"
        class="file-input"
        @change="handleFileSelect"
      />

      <div class="upload-message">
        <span class="upload-icon">📸</span>
        <p>Glissez vos fichiers ici ou cliquez pour sélectionner</p>
        <p class="upload-info">Images et vidéos uniquement (max 100MB par fichier)</p>
      </div>
    </div>

    <div v-if="uploadStore.files.length" class="selected-files">
      <h3>Fichiers sélectionnés ({{ uploadStore.files.length }})</h3>
      <div class="files-list">
        <div v-for="(file, index) in uploadStore.files" :key="index" class="file-item">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${file.progress || 0}%` }"></div>
          </div>
          <button @click="uploadStore.removeFile(index)" class="remove-button">×</button>
        </div>
      </div>
    </div>

    <div class="upload-actions" v-if="uploadStore.files.length">
      <button
        @click="uploadStore.uploadFiles(eventDate)"
        :disabled="uploadStore.isUploading"
        class="upload-button"
      >
        <span v-if="uploadStore.isUploading">
          <span class="spinner"></span>
          Envoi en cours...
        </span>
        <span v-else> Envoyer les fichiers </span>
      </button>
    </div>

    <div v-if="uploadStore.uploadComplete" class="upload-complete">
      <p>✅ Upload terminé avec succès !</p>
      <p class="download-info">
        Un lien de téléchargement sera disponible immédiatement après l'envoi.
      </p>
    </div>
  </div>
</template>

<style scoped>
.uploader {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: var(--wedding-light);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(212, 185, 165, 0.15);
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.event-date {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}

.upload-zone {
  border: 2px dashed var(--wedding-primary);
  padding: 40px;
  text-align: center;
  margin: 20px 0;
  border-radius: 8px;
  background: rgba(245, 230, 224, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-zone.dragging {
  border-color: var(--wedding-accent);
  background: rgba(139, 115, 85, 0.1);
}

.file-input {
  display: none;
}

.upload-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.7;
}

.select-button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.select-button:hover {
  background-color: #45a049;
}

.files-list {
  margin: 20px 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 10px;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 14px;
  color: #333;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background-color: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: var(--wedding-success);
  transition: width 0.3s ease;
}

.remove-button {
  background: none;
  border: none;
  color: #ff5252;
  cursor: pointer;
  font-size: 18px;
  padding: 0 5px;
}

.upload-actions {
  text-align: center;
  margin-top: 20px;
}

.upload-button {
  padding: 12px 30px;
  background-color: var(--wedding-primary);
  color: var(--wedding-dark);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.upload-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-complete {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  background-color: rgba(145, 180, 160, 0.2);
  border-radius: 4px;
  border: 1px solid var(--wedding-success);
}

.download-info {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
}
</style>

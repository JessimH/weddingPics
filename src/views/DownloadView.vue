<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import JSZip from 'jszip'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const isValid = ref(false)
const isExpired = ref(false)
const isDownloading = ref(false)
const downloadProgress = ref(0)
const totalFiles = ref(0)
const totalSize = ref('0 MB')
const availableFiles = ref([])
const previewFiles = ref([])

onMounted(async () => {
  try {
    const { data: link } = await supabase
      .from('download_links')
      .select('*')
      .eq('link_token', route.params.token)
      .single()

    if (!link) {
      error.value = "Ce lien de téléchargement n'existe pas."
      return
    }

    isValid.value = true
    isExpired.value = new Date(link.expires_at) < new Date()

    if (!isExpired.value) {
      const { data: dbFiles } = await supabase.from('uploads').select('*')

      for (const file of dbFiles) {
        const { data: fileExists } = await supabase.storage
          .from('wedding-files')
          .createSignedUrl(file.file_path, 60)

        if (fileExists) {
          availableFiles.value.push({
            ...file,
            url: fileExists.signedUrl,
          })
        }
      }

      // Sélectionner aléatoirement jusqu'à 10 fichiers pour la prévisualisation
      const shuffled = [...availableFiles.value].sort(() => 0.5 - Math.random())
      previewFiles.value = shuffled.slice(0, 10)

      totalFiles.value = availableFiles.value.length
      const totalBytes = availableFiles.value.reduce((acc, file) => acc + file.file_size, 0)
      totalSize.value = formatSize(totalBytes)

      if (totalFiles.value === 0) {
        error.value = "Aucun fichier n'est disponible au téléchargement."
        isValid.value = false
      }
    }
  } catch (e) {
    console.error('Erreur:', e)
    error.value = 'Une erreur est survenue lors de la vérification du lien.'
  } finally {
    loading.value = false
  }
})

const downloadAll = async () => {
  if (isDownloading.value) return
  isDownloading.value = true
  downloadProgress.value = 0

  try {
    const zip = new JSZip()
    const totalFiles = availableFiles.value.length
    let processedFiles = 0

    for (const file of availableFiles.value) {
      try {
        const { data } = await supabase.storage.from('wedding-files').download(file.file_path)

        if (data) {
          zip.file(file.file_name, data)
          processedFiles++
          downloadProgress.value = Math.round((processedFiles / totalFiles) * 100)
        }
      } catch (error) {
        console.error('Erreur:', error)
        console.warn(`Fichier non trouvé: ${file.file_name}`)
        continue
      }
    }

    if (processedFiles === 0) {
      throw new Error('Aucun fichier disponible au téléchargement')
    }

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 5 },
    })

    const url = window.URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'photos-mariage.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur:', error)
    alert('Une erreur est survenue lors du téléchargement')
  } finally {
    isDownloading.value = false
    downloadProgress.value = 0
  }
}

const formatSize = (bytes) => {
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
  <div class="download-page">
    <div class="download-container">
      <h1>Téléchargement des Photos & Vidéos</h1>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Vérification du lien...</p>
      </div>

      <div v-else-if="error" class="error">
        <h2>🚫 Lien non valide</h2>
        <p>{{ error }}</p>
      </div>

      <div v-else-if="isValid && !isExpired" class="download-content">
        <div class="download-info">
          <h2>✨ Vos photos sont prêtes !</h2>
          <p>
            Toutes les photos et vidéos du mariage sont disponibles au téléchargement! BSAHTEK !!!!!
          </p>

          <div class="stats">
            <div class="stat-item">
              <strong>{{ totalFiles }}</strong> fichiers
            </div>
            <div class="stat-item">
              <strong>{{ totalSize }}</strong>
            </div>
          </div>
        </div>

        <button @click="downloadAll" :disabled="isDownloading" class="download-button">
          <span v-if="isDownloading">
            <div class="spinner"></div>
            Téléchargement en cours...
          </span>
          <span v-else> Télécharger toutes les photos </span>
        </button>

        <div v-if="isDownloading" class="download-progress">
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${downloadProgress}%` }"></div>
          </div>
          <p>{{ downloadProgress }}%</p>
        </div>

        <!-- Mosaïque de prévisualisation -->
        <div v-if="previewFiles.length > 0" class="preview-gallery">
          <h3>Aperçu de certains de vos souvenirs</h3>
          <div class="preview-grid">
            <div v-for="file in previewFiles" :key="file.file_path" class="preview-item">
              <img
                v-if="file.file_type.startsWith('image/')"
                :src="file.url"
                :alt="file.file_name"
                loading="lazy"
              />
              <video
                v-else-if="file.file_type.startsWith('video/')"
                :src="file.url"
                preload="metadata"
                muted
                loop
              ></video>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="error">
        <h2>⏰ Lien expiré</h2>
        <p>Ce lien de téléchargement a expiré.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.download-page {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.download-container {
  max-width: 800px;
  width: 100%;
  background: var(--wedding-light);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(212, 185, 165, 0.15);
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 30px;
}

h2 {
  color: #444;
  margin-bottom: 20px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.error {
  color: #d32f2f;
  padding: 20px;
  background-color: #ffebee;
  border-radius: 8px;
}

.download-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

.download-button {
  padding: 15px 30px;
  background-color: #ff97a7;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 auto;
  transition: background-color 0.3s;
  letter-spacing: 0.5px;
}

.download-button:hover {
  background-color: #fd7f92;
}

.download-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.download-progress {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--wedding-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress {
  height: 100%;
  background-color: var(--wedding-success);
  transition: width 0.3s ease;
}

.preview-gallery {
  border-top: 1px solid var(--wedding-secondary);
}

.preview-gallery h3 {
  text-align: center;
  color: var(--wedding-dark);
  margin-bottom: 20px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 10px;
}

.preview-item {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-item img,
.preview-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.preview-item:hover img,
.preview-item:hover video {
  transform: scale(1.05);
}
</style>

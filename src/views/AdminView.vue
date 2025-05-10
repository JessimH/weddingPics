<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const isGenerating = ref(false)
const generatedLink = ref(null)
const error = ref(null)
const isCopied = ref(false)
const fileCount = ref(0)
const totalSize = ref('0 MB')
const hasFiles = ref(false)

onMounted(async () => {
  try {
    // Récupérer tous les fichiers de la base de données
    const { data: dbFiles } = await supabase.from('uploads').select('*')

    if (dbFiles) {
      // Vérifier l'existence de chaque fichier dans le bucket
      const availableFiles = []
      for (const file of dbFiles) {
        const { data: fileExists } = await supabase.storage
          .from('wedding-files')
          .createSignedUrl(file.file_path, 60)

        if (fileExists) {
          availableFiles.push(file)
        }
      }

      // Mettre à jour les compteurs avec uniquement les fichiers existants
      fileCount.value = availableFiles.length
      hasFiles.value = fileCount.value > 0
      const totalBytes = availableFiles.reduce((acc, file) => acc + file.file_size, 0)
      totalSize.value = formatSize(totalBytes)
    }
  } catch (e) {
    console.error('Erreur:', e)
    error.value = 'Erreur lors du chargement des fichiers'
  }
})

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

const generateDownloadLink = async () => {
  if (!hasFiles.value) {
    error.value = "Impossible de générer un lien : aucun fichier n'est disponible"
    return
  }

  isGenerating.value = true
  error.value = null

  try {
    // Génération du token unique
    const token = Math.random().toString(36).substring(2)

    // Date d'expiration (30 jours)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    // Création du lien dans la base de données
    const { error: dbError } = await supabase.from('download_links').insert({
      link_token: token,
      expires_at: expiryDate.toISOString(),
    })

    if (dbError) throw dbError

    // Construction de l'URL complète
    const baseUrl = window.location.origin
    generatedLink.value = `${baseUrl}/download/${token}`
  } catch (e) {
    console.error('Erreur:', e)
    error.value = 'Une erreur est survenue lors de la génération du lien'
  } finally {
    isGenerating.value = false
  }
}

const copyToClipboard = async () => {
  try {
    await navigator?.clipboard?.writeText(generatedLink.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000) // Réinitialise après 2 secondes
  } catch (err) {
    console.log(err)
    // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
    const textarea = document.createElement('textarea')
    textarea.value = generatedLink.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-container">
      <h1>Générer un lien de téléchargement</h1>

      <div class="files-info">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">Nombre de fichiers :</span>
            <span class="stat-value" :class="{ 'no-files': !hasFiles }">
              {{ fileCount }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Taille totale :</span>
            <span class="stat-value">{{ totalSize }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button
          @click="generateDownloadLink"
          :disabled="isGenerating || !hasFiles"
          class="generate-button"
        >
          <span v-if="isGenerating">Génération en cours...</span>
          <span v-else>Générer un lien de téléchargement</span>
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="generatedLink" class="link-container">
        <h2>Lien généré :</h2>
        <div class="link-box">
          <input type="text" readonly :value="generatedLink" ref="linkInput" />
          <button @click="copyToClipboard" :class="{ copied: isCopied }">
            {{ isCopied ? 'Copié !' : 'Copier' }}
          </button>
        </div>
        <p class="info">Ce lien sera valide pendant 30 jours</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.admin-container {
  max-width: 800px;
  width: 100%;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.actions {
  text-align: center;
  margin: 30px 0;
}

.generate-button {
  padding: 12px 24px;
  background-color: #ff97a7;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.generate-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  color: #d32f2f;
  text-align: center;
  margin: 20px 0;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

.link-container {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.link-box {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.link-box input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.link-box button {
  padding: 10px 20px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.link-box button.copied {
  background-color: #4caf50;
}

.info {
  color: #666;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}

.files-info {
  background-color: var(--wedding-secondary);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  color: var(--wedding-dark);
  font-size: 0.9em;
}

.stat-value {
  font-size: 1.2em;
  font-weight: 600;
  color: var(--wedding-accent);
}

.stat-value.no-files {
  color: #d32f2f;
}
</style>

import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useUploadStore = defineStore('upload', {
  state: () => ({
    files: [],
    isUploading: false,
    uploadComplete: false
  }),

  actions: {
    addFiles(newFiles) {
      const validFiles = newFiles.filter(file => {
        const isValid = file.type.startsWith('image/') || file.type.startsWith('video/')
        const isUnder100MB = file.size <= 100 * 1024 * 1024 // 100MB limit
        return isValid && isUnder100MB
      })

      this.files = [...this.files, ...validFiles.map(file => ({
        ...file,
        progress: 0
      }))]
    },

    removeFile(index) {
      this.files.splice(index, 1)
    },

    async uploadFiles(eventDate) {
      if (this.isUploading || this.files.length === 0) return

      this.isUploading = true
      this.uploadComplete = false

      try {
        for (const file of this.files) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `${eventDate}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('wedding-files')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          await supabase.from('uploads').insert({
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
          })

          const index = this.files.indexOf(file)
          this.files[index].progress = 100
        }

        // Création du lien de téléchargement
        const expiryDate = new Date(eventDate)
        expiryDate.setDate(expiryDate.getDate() + 7)

        await supabase.from('download_links').insert({
          link_token: Math.random().toString(36).substring(2),
          expires_at: expiryDate.toISOString()
        })

        this.uploadComplete = true
        this.files = []
      } catch (error) {
        console.error('Erreur upload:', error)
        throw error
      } finally {
        this.isUploading = false
      }
    }
  }
})

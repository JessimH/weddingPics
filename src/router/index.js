import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DownloadView from '../views/DownloadView.vue'
import AdminView from '../views/AdminView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/download/:token',
      name: 'download',
      component: DownloadView
    },
    {
      path: '/admin/generate-link',
      name: 'admin',
      component: AdminView
    }
  ]
})

export default router

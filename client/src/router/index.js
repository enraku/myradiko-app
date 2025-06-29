import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import ProgramGuide from '../views/ProgramGuide.vue'
import Recordings from '../views/Recordings.vue'
import Reservations from '../views/Reservations.vue'
import Settings from '../views/Settings.vue'
import Logs from '../views/Logs.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/program-guide',
    name: 'ProgramGuide',
    component: ProgramGuide
  },
  {
    path: '/recordings',
    name: 'Recordings',
    component: Recordings
  },
  {
    path: '/reservations',
    name: 'Reservations',
    component: Reservations
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/logs',
    name: 'Logs',
    component: Logs
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
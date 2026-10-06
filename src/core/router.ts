import { createRouter, createWebHistory } from 'vue-router'
import { tools } from '@/core/modules/registry'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/core/home/HomeView.vue') },
    ...tools.flatMap((tool) => tool.routes),
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/core/home/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

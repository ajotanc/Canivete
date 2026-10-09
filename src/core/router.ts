import { createRouter, createWebHistory } from 'vue-router'
import { tools } from '@/core/modules/registry'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/core/home/HomeView.vue') },
    { path: '/privacy', name: 'privacy', component: () => import('@/core/legal/PrivacyView.vue') },
    { path: '/terms', name: 'terms', component: () => import('@/core/legal/TermsView.vue') },
    ...tools.flatMap((tool) => tool.routes),
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/core/home/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

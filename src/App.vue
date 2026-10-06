<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import AppLayout from '@/core/layout/AppLayout.vue'
import { useTheme } from '@/core/theme/useTheme'

const { init } = useTheme()
onMounted(init)
</script>

<template>
  <AppLayout />
  <Toaster />
</template>

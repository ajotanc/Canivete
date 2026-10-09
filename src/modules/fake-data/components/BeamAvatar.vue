<script setup lang="ts">
import { computed } from 'vue'
import { beamSvg } from '../lib/avatar'

/** Avatar "beam" quadrado (sem cantos arredondados, como o `square` do Boring Avatars) da pessoa gerada; o desenho vem todo do nome (veja `lib/avatar.ts`). */
const props = defineProps<{ name: string }>()
const src = computed(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(beamSvg(props.name))}`)
</script>

<template>
  <img :src="src" :alt="`Avatar de ${name}`" width="56" height="56" class="size-14 shrink-0" />
</template>

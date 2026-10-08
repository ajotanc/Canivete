<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SliderRootProps & { class?: HTMLAttributes["class"], thumbLabel?: string }>()
const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "thumbLabel")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SliderRoot
    v-slot="{ modelValue }"
    data-slot="slider"
    :class="cn('relative flex h-8 w-full touch-none items-center select-none data-[disabled]:opacity-50', props.class)"
    v-bind="forwarded"
  >
    <SliderTrack data-slot="slider-track" class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
      <SliderRange data-slot="slider-range" class="absolute h-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, index) in modelValue"
      :key="index"
      data-slot="slider-thumb"
      :aria-label="thumbLabel"
      class="block size-5 shrink-0 rounded-full border-2 border-primary bg-background shadow-sm outline-none transition-[box-shadow] hover:ring-4 hover:ring-ring/30 focus-visible:ring-4 focus-visible:ring-ring/50 disabled:pointer-events-none motion-reduce:transition-none"
    />
  </SliderRoot>
</template>

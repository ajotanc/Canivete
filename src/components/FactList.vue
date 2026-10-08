<script setup lang="ts">
/**
 * Grade das caixas de fatos do cabeçalho (FactTile). É o mesmo desenho em todas as ferramentas:
 * duas caixas pequenas e a de destaque (`paper`) na largura toda embaixo; as três numa linha só quando o cabeçalho tem largura para isso (container query, não a largura da tela).
 * Use sempre três caixas: duas `glass` e uma `paper`. Nas `glass`, rótulo e valor cabem em uma linha (até uns 12 e 11 caracteres),
 * para todas as caixas terem a mesma altura em todas as telas; o texto mais longo vai na `paper`.
 */
</script>

<template>
  <div class="@container">
    <dl class="grid grid-cols-2 gap-2 pt-1 sm:gap-3 sm:pt-2 @xl:grid-cols-3">
      <slot />
    </dl>
  </div>
</template>

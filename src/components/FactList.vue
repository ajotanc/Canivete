<script setup lang="ts">
/**
 * Grade das caixas de fatos do cabeçalho (FactTile). É o mesmo desenho em todas as ferramentas:
 * duas caixas pequenas e a de destaque (`paper`) na largura toda embaixo; as três numa linha só quando o cabeçalho tem largura para isso (container query, não a largura da tela).
 * Use sempre três caixas: duas `glass` e uma `paper`. Nas `glass`, rótulo e valor cabem em uma linha num celular de 360px:
 * até 83px, uns 12 caracteres no rótulo e 9 no valor ("Lados do dado" / "4 a 100", "Prazos" / "Dias úteis").
 * Número dinâmico vai sozinho no valor, com a unidade no rótulo ("Pessoas" / "12", não "Participantes" / "12 pessoas").
 * O texto mais longo vai na `paper`, que ocupa a linha inteira no celular. O teste `tests/components/factTiles.test.ts` confere os textos fixos.
 */
</script>

<template>
  <div class="@container">
    <dl class="grid grid-cols-2 gap-2 pt-1 sm:gap-3 sm:pt-2 @xl:grid-cols-3">
      <slot />
    </dl>
  </div>
</template>

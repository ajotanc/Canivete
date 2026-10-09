<script setup lang="ts">
import { CalendarDays, FileText, UserRound, Wallet } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { LEGAL } from '@/core/config'
import LegalSection from './LegalSection.vue'

const updated = new Date(`${LEGAL.updatedAt}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
const mail = `mailto:${LEGAL.contactEmail}`
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="FileText" title="Termos de uso" description="As regras para usar o Canivete e o que você pode esperar das ferramentas.">
      <FactList>
        <FactTile :icon="Wallet" label="Preço">Grátis</FactTile>
        <FactTile :icon="UserRound" label="Conta">Opcional</FactTile>
        <FactTile :icon="CalendarDays" label="Valem desde" tone="paper">{{ updated }}</FactTile>
      </FactList>
    </PageHeader>

    <article class="mx-auto max-w-3xl space-y-10">
      <LegalSection id="aceite" title="1. Aceite">
        <p>
          Ao usar o Canivete, você concorda com estes termos e com a <RouterLink to="/privacy">política de privacidade</RouterLink>. Se não concordar, não use o site.
        </p>
      </LegalSection>

      <LegalSection id="servico" title="2. O serviço">
        <p>
          O Canivete reúne ferramentas gratuitas para tarefas do dia a dia. Não é preciso criar conta para usá-las; a conta só existe para quem organiza um amigo secreto. As
          ferramentas podem mudar, ganhar recursos novos ou sair do ar, com ou sem aviso.
        </p>
      </LegalSection>

      <LegalSection id="resultados" title="3. Resultados das ferramentas">
        <p>
          As contas e conversões (porcentagem, datas, horas, combustível, unidades, moeda e as outras) são feitas com cuidado, mas servem de apoio. Confira os valores antes de
          usar num documento, num contrato ou numa decisão de dinheiro.
        </p>
        <ul>
          <li>A cotação de moedas vem da AwesomeAPI e pode ser diferente da que o seu banco ou a casa de câmbio cobra.</li>
          <li>Os feriados são só os nacionais. Feriados estaduais e municipais não entram.</li>
          <li>
            Os CPFs, CNPJs e dados de pessoas gerados pelo site são fictícios e servem só para testar sistemas. É proibido usá-los para se passar por alguém, abrir cadastros ou
            cometer fraude.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="sorteios" title="4. Sorteios">
        <p>
          O sorteador, a roleta, a moeda, os dados e o amigo secreto usam o gerador de números aleatórios criptográfico do navegador ou do servidor, sem favorecer ninguém. O link
          de um sorteio compartilhado mostra se o registro foi alterado depois de criado. O Canivete não se responsabiliza por prêmios, apostas ou acordos feitos com base num
          sorteio.
        </p>
      </LegalSection>

      <LegalSection id="contas" title="5. Contas e amigo secreto">
        <ul>
          <li>Quem cria uma conta de organizador cuida da própria senha e responde pelo que faz com ela.</li>
          <li>O organizador só deve cadastrar pessoas que sabem que estão participando do grupo.</li>
          <li>Cada participante cuida do próprio PIN. Se esquecer, o organizador pode zerar o PIN no painel.</li>
        </ul>
      </LegalSection>

      <LegalSection id="conteudo" title="6. O que você envia">
        <p>
          Você responde pelo que escreve ou envia: nomes, listas de presentes, links, perguntas, recados do mural e a imagem do cabeçalho do grupo. Só envie o que tem direito de
          usar. Não é permitido enviar conteúdo ilegal, ofensivo, discriminatório, de assédio ou que exponha outra pessoa sem a autorização dela. Conteúdo assim pode ser apagado,
          junto com o grupo em que foi publicado.
        </p>
      </LegalSection>

      <LegalSection id="proibido" title="7. Uso proibido">
        <p>
          Não é permitido tentar burlar a segurança do site, adivinhar o PIN de outra pessoa, ler dados de grupos dos quais você não participa, nem sobrecarregar o servidor com
          acessos automáticos.
        </p>
      </LegalSection>

      <LegalSection id="responsabilidade" title="8. Limites de responsabilidade">
        <p>
          O Canivete é oferecido como está, sem garantia de que vai estar sempre no ar ou livre de erros. Dados guardados só no seu aparelho somem se você limpar o navegador ou
          trocar de aparelho. Dentro do que a lei permite, o Canivete não responde por prejuízos causados por decisões tomadas com base nos resultados das ferramentas. Nada aqui
          tira os direitos que o Código de Defesa do Consumidor garante a você.
        </p>
      </LegalSection>

      <LegalSection id="mudancas" title="9. Mudanças nestes termos">
        <p>Quando os termos mudarem, a data no topo da página muda junto. Continuar usando o site depois disso vale como aceite da nova versão.</p>
      </LegalSection>

      <LegalSection id="lei" title="10. Lei e contato">
        <p>
          Estes termos seguem as leis do Brasil. Dúvidas, pedidos e denúncias de conteúdo vão para <a :href="mail">{{ LEGAL.contactEmail }}</a>.
        </p>
      </LegalSection>
    </article>
  </section>
</template>

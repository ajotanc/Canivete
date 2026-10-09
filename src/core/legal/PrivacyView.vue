<script setup lang="ts">
import { CalendarDays, Cookie, EyeOff, ShieldCheck } from '@lucide/vue'
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
    <PageHeader filled :icon="ShieldCheck" title="Política de privacidade" description="Quais dados o Canivete usa, onde eles ficam e como pedir para apagar.">
      <FactList>
        <FactTile :icon="Cookie" label="Cookies">Só o login</FactTile>
        <FactTile :icon="EyeOff" label="Rastreamento">Nenhum</FactTile>
        <FactTile :icon="CalendarDays" label="Atualizada em" tone="paper">{{ updated }}</FactTile>
      </FactList>
    </PageHeader>

    <article class="mx-auto max-w-3xl space-y-10">
      <LegalSection id="responsavel" title="1. Quem é o responsável">
        <p>
          O Canivete é um conjunto de ferramentas gratuitas na internet. Ele é o responsável (controlador, na linguagem da LGPD) pelos dados descritos aqui. Para qualquer assunto
          sobre os seus dados, escreva para <a :href="mail">{{ LEGAL.contactEmail }}</a>.
        </p>
      </LegalSection>

      <LegalSection id="aparelho" title="2. O que fica só no seu aparelho">
        <p>
          A maior parte das ferramentas funciona inteira no navegador: o texto que você digita num contador, num formatador de JSON ou num gerador de senha não é enviado a
          ninguém. Algumas escolhas ficam guardadas no próprio navegador (no <strong>armazenamento local</strong>), para você não precisar repetir:
        </p>
        <ul>
          <li>o tema claro ou escuro e o som ligado ou desligado;</li>
          <li>os jogadores e os pontos do placar, e os tempos do Pomodoro;</li>
          <li>que você já viu o aviso de cookies.</li>
        </ul>
        <p>
          No amigo secreto, o seu nome e o PIN ficam guardados só na aba aberta (armazenamento da sessão) e somem quando você fecha a aba. Esses dados não saem do aparelho e você
          pode apagá-los quando quiser, limpando os dados do site nas configurações do navegador.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="3. Cookies">
        <p>
          O Canivete usa <strong>um único cookie</strong>: o da sessão de quem entra com e-mail e senha para organizar um amigo secreto. Ele é criado pelo nosso servidor
          (api.ajotanc.com.br) e serve só para manter você conectado. Sem ele, o login não funciona. Se o navegador bloquear esse cookie, a mesma sessão fica guardada
          no armazenamento local.
        </p>
        <p>Quem só usa as ferramentas, sem entrar numa conta, não recebe cookie nenhum. Não usamos cookies de propaganda, de análise de audiência nem de redes sociais.</p>
      </LegalSection>

      <LegalSection id="servidor" title="4. O que vai para o nosso servidor">
        <p>Só duas ferramentas guardam dados no servidor do Canivete, e só quando você usa a função que precisa disso:</p>
        <ul>
          <li>
            <strong>Sorteador de nomes</strong>, quando você cria o link do resultado: a lista de nomes, os sorteados, a data e um código de verificação. Quem tiver o link vê
            tudo isso. O registro fica guardado para o link continuar funcionando.
          </li>
          <li>
            <strong>Amigo secreto</strong>: a conta de quem organiza (nome, e-mail e senha, esta guardada como hash) e os dados do grupo, ou seja, nome, valor sugerido,
            data, cor, imagem do cabeçalho, nomes das pessoas, o PIN de cada uma (também guardado como hash, nunca em texto puro), listas de presentes e links, perguntas anônimas e
            respostas, recados do mural e quem já abriu a carta.
          </li>
        </ul>
        <p>
          Como todo servidor, o nosso também registra informações técnicas de cada acesso, como data, hora e endereço IP. Esses registros servem para manter o serviço no ar e
          investigar falhas.
        </p>
      </LegalSection>

      <LegalSection id="terceiros" title="5. Serviços de outras empresas">
        <p>Três ferramentas consultam serviços públicos direto do seu navegador. Eles recebem o que a consulta precisa e, como em qualquer visita a um site, o seu endereço IP:</p>
        <ul>
          <li><strong>Consulta de CEP</strong>: o CEP ou o nome da rua vão para o ViaCEP.</li>
          <li><strong>Conversor de moeda</strong>: o pedido de cotação vai para a AwesomeAPI. O valor que você digita não é enviado.</li>
          <li><strong>Feriados do ano</strong>: o ano escolhido vai para a BrasilAPI.</li>
        </ul>
        <p>Os botões de WhatsApp abrem o próprio WhatsApp, que segue a política de privacidade dele.</p>
      </LegalSection>

      <LegalSection id="uso" title="6. Para que os dados são usados">
        <p>
          Só para as ferramentas funcionarem: mostrar o resultado de um sorteio, fazer o sorteio do amigo secreto e mostrar a cada pessoa quem ela tirou. Os dados não são
          vendidos, não são usados para propaganda e não servem para montar perfis.
        </p>
        <p>
          Pela LGPD, o uso se apoia na execução do serviço que você pediu (art. 7º, V) e, nos registros técnicos, no legítimo interesse de manter o site seguro e funcionando
          (art. 7º, IX).
        </p>
      </LegalSection>

      <LegalSection id="prazo" title="7. Por quanto tempo">
        <ul>
          <li>Sorteio compartilhado: enquanto o link existir. Para apagar um, mande o link para o e-mail de contato.</li>
          <li>Amigo secreto: até o organizador excluir o grupo. A exclusão apaga as pessoas, as perguntas, o mural e a imagem do cabeçalho.</li>
          <li>Conta de organizador: até você pedir a exclusão.</li>
        </ul>
      </LegalSection>

      <LegalSection id="seguranca" title="8. Segurança">
        <p>
          A conexão é sempre cifrada (HTTPS). As tabelas do amigo secreto não podem ser lidas pelo navegador: tudo passa por uma função no servidor, que confere o nome e o PIN e
          devolve a cada pessoa só o próprio par. Senha e PIN são guardados como hash, um código que não pode ser revertido para o original, e cinco tentativas erradas de PIN bloqueiam o acesso por 15 minutos.
        </p>
      </LegalSection>

      <LegalSection id="direitos" title="9. Seus direitos">
        <p>
          Você pode pedir a confirmação de que tratamos dados seus, o acesso a eles, a correção, a exclusão e as outras garantias do art. 18 da LGPD. Escreva para
          <a :href="mail">{{ LEGAL.contactEmail }}</a> dizendo o que precisa e, se for de um grupo do amigo secreto ou de um sorteio, mande o link. A resposta sai em até 15 dias. Se
          não ficar satisfeito, você também pode procurar a Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection id="mudancas" title="10. Mudanças nesta política">
        <p>
          Quando esta política mudar, a data no topo da página muda junto e o aviso de cookies aparece de novo. O uso do Canivete também segue os
          <RouterLink to="/terms">termos de uso</RouterLink>.
        </p>
      </LegalSection>
    </article>
  </section>
</template>

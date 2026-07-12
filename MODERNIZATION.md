# Modernização do simulador

Esta branch introduz uma camada visual nova sem substituir nem arriscar as animações existentes do simulador.

## Como testar

Abrir:

```text
modern.html
```

O ficheiro carrega o simulador atual e aplica a nova experiência visual.

## Implementado nesta branch

- Shell moderno com barra superior e navegação entre os três módulos.
- Painel contextual com descrição da fase ativa.
- Área 3D com aspeto de aplicação técnica moderna.
- Interface responsiva para computador, tablet e telemóvel.
- Tipografia maior e hierarquia visual mais clara.
- Botão de texto ampliado.
- Botão de ecrã inteiro.
- Estilos modernos aplicados aos painéis originais do simulador.
- Seleção do sistema de travamento por cartões em vez de um slider abstrato.
- Descrição do princípio de funcionamento de cada travamento.
- Melhorias iniciais de acessibilidade: idioma, rótulos dos sliders e estado anunciado.

## Sistemas de travamento expostos

1. Sem travamento.
2. Contra-porca.
3. Anilha de freio.
4. Patilha dobrável.
5. Cavilha.

Nesta primeira etapa os cartões comandam o modelo físico que já existia. A geometria 3D ainda usa o conjunto atual de porcas/anilhas.

## Próxima etapa técnica

Para mostrar diferenças mecânicas reais na animação é necessário alterar diretamente a construção Three.js do conjunto exterior:

- extrair a criação das porcas e anilhas para um construtor próprio;
- criar uma geometria diferente para cada sistema;
- desmontar e montar o sistema escolhido durante a troca;
- alterar o comportamento de rotação e deslocamento axial conforme o mecanismo;
- representar a dobra da patilha;
- representar a inserção da cavilha;
- separar anilha de mola, anilha dentada e par de anilhas de cunha;
- libertar geometrias e materiais antigos com `dispose()` durante a troca.

## Arquitetura recomendada para a segunda etapa

```text
src/
  core/
    state.js
    simulation-config.js
  machine/
    cylinder.js
    shaft.js
    locking-system.js
    locking-geometries.js
  simulations/
    junker-model.js
    clogging-model.js
    production-model.js
  ui/
    navigation.js
    locking-selector.js
    panels.js
```

A migração para esta estrutura deve ser feita depois de confirmar visualmente a direção da nova interface.

## Limitações atuais

- `modern.html` é uma entrada alternativa; o `index.html` original permanece intacto.
- O código principal continua concentrado no `index.html`.
- Os cinco cartões correspondem aos cinco níveis do modelo atual.
- Ainda não existem modelos 3D exclusivos para cada sistema.
- Ainda não foi feita a migração para Vite ou módulos ES.

Esta abordagem permite avaliar a nova UI sem comprometer a versão funcional atual.

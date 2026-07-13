# Tarefas — versão 2.0

Este ficheiro acompanha o trabalho realizado no PR #29. Uma tarefa só recebe visto depois de implementação, review e testes automáticos.

## Fase A — Arquitetura

- [x] Extrair estado global para `src/core/state.js`
- [x] Extrair constantes e parâmetros para `src/core/config.js`
- [x] Extrair modelo do efeito Junker
- [ ] Extrair cálculo de produção e qualidade
- [ ] Extrair modelo de entupimento
- [ ] Extrair sistema de travamento e geometrias
- [ ] Extrair construção da máquina 3D
- [ ] Extrair previews e canvas 2D
- [ ] Integrar a interface sem depender de injeção no iframe
- [ ] Reduzir `index.html` a estrutura e arranque

## Fase B — Testes e robustez

- [x] Criar testes unitários do estado
- [x] Criar testes unitários do modelo Junker
- [ ] Testar limites e invariantes de produção
- [ ] Criar testes unitários do entupimento
- [ ] Testar libertação de memória Three.js
- [ ] Criar testes visuais para computador e telemóvel

## Fase C — Experiência 3D

- [ ] Criar montagem e desmontagem animada dos travamentos
- [ ] Criar transições de câmara por sistema
- [ ] Adicionar linha de referência de desaperto
- [ ] Melhorar patilha, anilhas de cunha e porca castelo
- [ ] Adicionar pontos clicáveis e destaque de peças
- [ ] Criar comparação lado a lado

## Fase D — Formação

- [ ] Criar cenários predefinidos de montagem e desgaste
- [ ] Criar cenários predefinidos de tinta e raclete
- [ ] Criar modo Operador
- [ ] Criar modo Formador
- [ ] Criar diagnóstico guiado por sintomas

## Fase E — Documentação e integração

- [ ] Documentar arquitetura modular
- [ ] Documentar entradas e resultados dos modelos
- [ ] Documentar coeficientes empíricos
- [ ] Atualizar screenshots e instruções do GitHub Pages
- [ ] Fazer review final
- [ ] Marcar PR pronto para review
- [ ] Integrar na `main`

## Registo de review

### Tarefa 1 — Estado global

- Implementado em `src/core/state.js`.
- A versão moderna substitui a declaração antiga durante o carregamento e usa o estado criado pelo módulo.
- Adicionadas validação, criação com overrides e reposição segura dos valores por defeito.
- A review encontrou os testes de estado misturados no smoke test; foram separados para `tests/state.spec.js`.
- O workflow passou a executar toda a suite com `npm test`.
- Resultado final do GitHub Actions: **success**.

### Tarefa 2 — Constantes e parâmetros

- Implementado em `src/core/config.js`.
- Centralizados limites do estado, parâmetros mecânicos, parâmetros de produção e os cinco sistemas de travamento.
- A versão moderna injeta uma ponte de configuração no simulador legado e substitui os valores esperados durante o carregamento.
- Adicionados testes próprios em `tests/config.spec.js` para o módulo e para a ligação real ao iframe.
- A primeira review encontrou `maxReferenceRpm` definido mas ainda não usado pela normalização da velocidade; a fórmula foi corrigida para consumir o valor modular.
- A segunda review não encontrou constantes explícitas desconectadas dentro do âmbito desta tarefa.
- Resultado final do GitHub Actions: **success**.

### Tarefa 3 — Modelo do efeito Junker

- Implementado em `src/simulations/junker-model.js`.
- Extraídos cálculo de excentricidade e vibração, taxa de desaperto e taxa de dano mecânico.
- A versão moderna substitui a função `instability()` e os blocos de desaperto e dano durante o carregamento.
- Adicionados testes para máquina parada, aumento de vibração com desgaste, ordem de resistência dos travamentos, tolerância de dano e ligação ao simulador real.
- A primeira review confirmou o funcionamento, mas encontrou um helper de teste não utilizado; foi removido.
- A segunda execução da suite passou integralmente em Chromium.
- Resultado final do GitHub Actions: **success**.

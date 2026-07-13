# Tarefas — versão 2.0

Este ficheiro acompanha o trabalho realizado no PR #29. Uma tarefa só recebe visto depois de implementação, review e testes automáticos.

## Fase A — Arquitetura

- [ ] Extrair estado global para `src/core/state.js`
- [ ] Extrair constantes e parâmetros para `src/core/config.js`
- [ ] Extrair modelo do efeito Junker
- [ ] Extrair cálculo de produção e qualidade
- [ ] Extrair modelo de entupimento
- [ ] Extrair sistema de travamento e geometrias
- [ ] Extrair construção da máquina 3D
- [ ] Extrair previews e canvas 2D
- [ ] Integrar a interface sem depender de injeção no iframe
- [ ] Reduzir `index.html` a estrutura e arranque

## Fase B — Testes e robustez

- [ ] Criar testes unitários do estado
- [ ] Criar testes unitários do modelo Junker
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

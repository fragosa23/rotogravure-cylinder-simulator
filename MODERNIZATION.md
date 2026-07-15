# Modernização do simulador

## Estado atual

A primeira fase da modernização está implementada em `modern.html` sem substituir o simulador base de `index.html`.

### Concluído

- novo shell visual responsivo;
- navegação direta entre os três módulos;
- tema moderno aplicado ao simulador incorporado;
- tipografia e áreas de toque maiores;
- modo de texto ampliado e ecrã inteiro;
- cartões para seleção do sistema de travamento;
- campos numéricos sincronizados com os sliders técnicos principais;
- modelos Three.js diferentes para contra-porca, anilhas de cunha, patilha e porca castelo com cavilha;
- correção da terminologia e dos coeficientes didáticos de resistência;
- correção da documentação de desenvolvimento e diâmetro;
- teste Playwright e workflow de GitHub Actions.

## Decisões confirmadas

### Massa do cilindro

Não será transformada num parâmetro configurável nesta fase. O projeto assume cilindros equivalentes e não precisa de uma escolha de construção ou material.

### Custos em euros

Não fazem parte do objetivo atual. A aplicação continua centrada em formação técnica, qualidade, manutenção e produção.

### Sistemas de travamento

A aplicação distingue cinco configurações:

1. sem travamento;
2. contra-porca;
3. anilhas de cunha;
4. anilha de patilha;
5. porca castelo com cavilha.

Cada configuração altera a seleção, descrição, resistência didática e representação 3D.

## Arquitetura

A interface moderna foi separada do simulador base para reduzir risco. Contudo, `index.html` continua monolítico.

A próxima refatoração deve ser feita por etapas:

```text
src/
  core/
    state.js
    constants.js
    clock.js
  scene/
    scene.js
    camera.js
    dispose.js
  machine/
    cylinder.js
    shaft.js
    locking.js
    ink-unit.js
  simulations/
    junker.js
    clogging.js
    production.js
  previews/
    registration.js
    print.js
  ui/
    controls.js
    panels.js
```

## Próximas prioridades

1. extrair os cálculos do efeito Junker para funções puras;
2. extrair a simulação de entupimento;
3. centralizar constantes e unidades;
4. acrescentar testes unitários dos modelos;
5. atualizar Three.js num PR isolado;
6. acrescentar descarte sistemático de geometrias, materiais e texturas nas reconstruções;
7. criar transições de câmara específicas para cada sistema de travamento.

## Regra de validação

O PR só deve ser integrado quando o workflow `Simulator smoke test` estiver verde. O teste abre a aplicação em Chromium, percorre os módulos e valida a seleção dos cinco sistemas de travamento.
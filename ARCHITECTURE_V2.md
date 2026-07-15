# Arquitetura da versão 2.0

## Entradas

- `modern.html` — shell visual recomendado.
- `src/bootstrap.js` — coordena carregamento, UI, travamentos e formação.
- `src/simulator-loader.js` — ponte temporária para o simulador histórico enquanto o HTML é dividido.

## Núcleo

- `src/core/state.js` — criação, validação e reposição do estado.
- `src/core/config.js` — limites, parâmetros mecânicos, produção e sistemas de travamento.

## Modelos puros

- `src/simulations/junker-model.js` — excentricidade, vibração, desaperto e dano.
- `src/simulations/production-model.js` — velocidade, qualidade, rejeição, responsabilidades e perdas.
- `src/simulations/clogging-model.js` — secagem, entupimento, véu, riscos e refugo.

Os modelos não acedem ao DOM nem ao Three.js. Recebem objetos e devolvem resultados, permitindo testes independentes.

## Experiência 3D

- `src/machine/locking-system.js` — ciclo de vida, geometrias e animação dos travamentos.
- O restante modelo da máquina continua temporariamente no núcleo histórico e deve ser extraído por famílias de peças, sem reescrever a física no mesmo passo.

## Formação

- `src/training/training-experience.js` — cenários, modos Operador/Formador, diagnóstico, pontos de interesse e comparação.

## UI

- `modern-ui.js`, `modern-ui.css` e `embedded-ui.css` — shell, cartões, campos numéricos e acessibilidade.
- A injeção no iframe é uma ponte de migração, não a arquitetura final.

## Fluxo de dados

1. O utilizador altera um controlo.
2. O estado é atualizado.
3. Um modelo puro calcula o novo resultado.
4. A camada de apresentação atualiza DOM, canvas e Three.js.
5. Playwright confirma invariantes, interação e ausência de erros.

## Regra de evolução

Uma tarefa só é concluída quando:

1. o código está isolado no módulo correto;
2. existe teste do comportamento relevante;
3. a suite completa passa;
4. a review não encontra dependências ocultas, duplicações ou fugas de recursos.

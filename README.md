# Simulação — Problemas do Dia a Dia em Rotogravura

Simulação interativa 3D que demonstra **problemas causados por montagem incorreta de um cilindro de rotogravura, desgaste não tratado e parâmetros inadequados de impressão**.

Um dos focos é o **efeito Junker** — o auto-desaperto de elementos roscados provocado por vibração transversal. Quando o escatel, a ranhura ou o assentamento apresentam folga, o cilindro pode rodar descentrado, produzir um golpe radial a cada volta e reduzir progressivamente a pré-carga das porcas, mesmo quando foram corretamente apertadas no início.

O objetivo é didático: mostrar, em linguagem de produção, como pequenos defeitos se traduzem em **instabilidade, tempo parado, material rejeitado e perda de capacidade**, e porque a manutenção preventiva é importante.

## Como usar

A interface recomendada é [`modern.html`](modern.html). Esta abre o simulador existente dentro de uma interface mais moderna, responsiva e acessível.

Também é possível abrir diretamente [`index.html`](index.html), que contém o simulador base.

Não é necessária instalação. A biblioteca 3D [Three.js](https://threejs.org/) é carregada por CDN, pelo que é necessária ligação à internet pelo menos para esse recurso.

> O repositório pode ser publicado com GitHub Pages. Nesse caso, abre `modern.html` para usar a interface completa.

## Fases

A aplicação inclui três módulos:

1. **Montagem do cilindro** — sequência de montagem do cilindro no veio, com escolha do desenvolvimento e do desgaste do escatel/ranhura.
2. **Efeito Junker** — defeitos de montagem, vibração, auto-desaperto, sistemas de travamento e impacto produtivo.
3. **Entupimento dos cilindros** — tinteiro, raclete e pressor, com tinta base solvente de acetato de etilo. A simulação representa a janela entre a lâmina e o ponto de impressão, a influência da velocidade, viscosidade, retardador, filtragem, pressão e ângulo da raclete, e a falha antecipada das altas-luzes.

## O que se pode fazer

A cena representa o conjunto formado por veio, rodas de apoio, buchas, escatel, ranhura, rosca, porcas, cilindro, tinteiro, raclete, pressor e filme.

É possível:

- variar a velocidade e o desenvolvimento do cilindro;
- introduzir defeitos com severidade entre 0 e 100%;
- comparar chaveta mal assente no lado motor e no lado exterior;
- simular desgaste do escatel e da ranhura;
- simular alojamento alargado e folga nos rolamentos;
- definir folga inicial das porcas;
- escolher e visualizar sistemas de travamento diferentes;
- alterar a vista e aproximar pontos específicos da máquina;
- comparar a prova original com os defeitos de registo e impressão.

### Sistemas de travamento

A interface moderna permite escolher:

1. **Sem travamento** — uma porca dependente apenas da pré-carga e do atrito.
2. **Contra-porca** — duas porcas apertadas em oposição.
3. **Anilhas de cunha** — par de anilhas com rampas opostas.
4. **Anilha de patilha** — patilha dobrada sobre uma face da porca.
5. **Porca castelo com cavilha** — bloqueio positivo através de pino transversal.

Cada opção possui representação visual própria e resistência didática diferente no modelo. Os coeficientes servem para comparação pedagógica e não substituem dados de ensaio do fabricante.

> **Demonstração do efeito Junker:** mantém a folga inicial a 0%, aumenta o desgaste do escatel/ranhura ou a chaveta mal assente e sobe a rotação. Observa a deformação no meio do vão, a perda de pré-carga e a progressão do desaperto.

## O que a simulação estima

Em tempo real, o painel apresenta:

- excentricidade e severidade de vibração;
- oscilação do veio/cilindro com os apoios tratados como nós fixos;
- evolução do auto-desaperto;
- resistência relativa do sistema de travamento selecionado;
- velocidade possível face ao potencial da máquina;
- erro de registo e defeitos de transferência de tinta;
- percentagem de refugo e aceitação do trabalho;
- metros rejeitados, tempo de reajuste e eventos de desaperto;
- repartição pedagógica das causas entre desgaste, manutenção e operador.

Os valores absolutos são estimativas de um modelo simplificado. Devem ser lidos como tendências comparativas, não como medições da máquina.

## Medidas usadas no modelo

- Veio: Ø65 mm, comprimento 1920 mm
- Roda: abas Ø155 mm, calha Ø145 mm, largura 70 mm
- Cilindro: largura 850 mm
- Desenvolvimento padrão: 420 mm, correspondente a Ø aproximado de 133,7 mm
- Desenvolvimento configurável: 300–800 mm
- Pressor: largura 850 mm, banda útil 800 mm
- Lado motor: peça fixa com escatel → bucha → cilindro
- Lado exterior: rosca → bucha → sistema de travamento

## Estrutura atual

- `index.html` — simulador 3D e modelos didáticos existentes
- `modern.html` — interface moderna recomendada
- `modern-ui.css` — layout exterior
- `embedded-ui.css` — tema aplicado ao simulador incorporado
- `modern-ui.js` — navegação, acessibilidade, controlos numéricos e modelos visuais de travamento
- `MODERNIZATION.md` — decisões e próximos passos arquiteturais

## Aviso

Ferramenta **didática**. As rotações de falha, forças, tolerâncias e resultados apresentados são estimativas de um modelo simplificado, não um cálculo estrutural nem uma instrução de operação. Não usar para definir limites de segurança. Qualquer soltura, vibração anormal ou defeito recorrente deve ser comunicado à manutenção e tratado segundo os procedimentos da máquina e da empresa.
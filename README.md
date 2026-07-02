# Simulação — Efeito Junker em Cilindros de Rotogravura

Simulação interativa 3D (web) que demonstra **os problemas causados por uma má
montagem de um cilindro de rotogravura e pela falta de manutenção preventiva ao
longo de um trabalho do dia a dia**.

O foco é o **efeito Junker** — o *auto-desaperto de elementos roscados por
vibração transversal*, um fenómeno comprovado pela física: quando o escatel ou a
chaveta estão gastos/mal engatados, o cilindro roda "encavalitado", dá um golpe
radial a cada volta e esse golpe vai **desapertando as porcas sozinho**, mesmo
que tenham sido bem apertadas na montagem.

O objetivo é didático: mostrar, em linguagem de produção, como pequenos defeitos
de montagem e o desgaste não tratado se traduzem em **metros de material
perdidos, tempo parado em reajustes e refugo do lote** — e porque é que a
**manutenção preventiva compensa**.

## Como usar

Abre o ficheiro [`index.html`](index.html) num navegador moderno (Chrome, Edge,
Firefox, Safari). Não precisa de servidor nem de instalação — basta duplo
clique. A biblioteca 3D ([three.js](https://threejs.org/)) é carregada por CDN,
por isso é preciso ligação à internet na primeira vez.

> **Atalho online:** podes também publicar o repositório com GitHub Pages e
> abrir o `index.html` diretamente pelo browser.

## Fases

A app abre num menu com três fases:

1. **Montagem do cilindro** — como se monta o cilindro no veio, passo a passo
   (com escolha do perímetro e do desgaste do escatel/ranhura).
2. **Simulador · Efeito Junker** — em máquina: defeitos, vibração, desaperto
   das anilhas e impacto na produção.
3. **Entupimento dos cilindros** — a máquina com **tinteiro**, **raclete
   (lâmina)** e **pressor**, com tinta base solvente de **acetato de etilo**
   (evapora muito depressa). A secagem dá-se na janela entre a lâmina e o
   ponto de impressão (zona assinalada a laranja no cilindro): a baixa
   velocidade e nas paragens os alvéolos vão abertos mais tempo e a tinta
   seca lá dentro — os **alvéolos pequenos (altas-luzes) falham primeiro**.
   Escolhe-se a **cor no tinteiro (C/M/Y/K)** e vê-se o efeito dessa cor num
   trabalho em **cromia**; o **retardador** (solvente lento) trava a secagem
   (em excesso não seca no filme), a **viscosidade** controla-se com solvente
   e a **filtragem** evita acumulação. A pressão errada da lâmina provoca
   véu / riscos, e a lavagem do cilindro recupera as células.

## O que se pode fazer

A cena mostra o conjunto real — veio, rodas que assentam na meia-cana, motor do
lado motor, buchas, peça fixa com escatel/chaveta e, do lado de fora, a rosca
com as duas anilhas — e deixa-te:

- **Variar a velocidade** (rpm) e o **perímetro/Ø** do cilindro.
- **Introduzir defeitos** com severidade 0–100%, cada um identificado pela sua
  origem:
  - Chaveta mal assente (escatel da bucha) — *operador* — **lado dentro e lado
    fora independentes**, porque pode estar bem assente de um lado e mal do outro
  - Escatel gasto — *desgaste*
  - Alojamento alargado — *desgaste*
  - Anilhas · folga inicial — *operador* — o aperto com que saíram da montagem
  - Folga nos rolamentos — *manutenção*

> **Demonstração do efeito Junker:** deixa a folga inicial das anilhas a 0%
> (bem apertadas) e vai subindo o escatel gasto ou a chaveta mal assente. Com a
> máquina a rodar, vê a oscilação a crescer a meio vão e as porcas a
> desapertarem-se sozinhas, em tempo real, até ao ponto de falha.
- **Escolher o travamento das anilhas** (nenhum → contra-porca → anilha freio →
  patilha dobrável → cavilha) e ver como resiste — ou não — à vibração.
- **Mudar de vista** (perspetiva, lado, lado motor, apoio na roda, vista
  explodida).

## O que a simulação calcula

Em tempo real, a partir dos defeitos e da velocidade, o painel estima:

- **Excentricidade e vibração** do conjunto e o estado (estável → crítico →
  falha).
- **Oscilação realista (whirl):** as rodas de apoio são nós fixos (rolam na
  meia-cana mas não saltam); quem oscila é o veio/cilindro a **meio vão**, que
  encurva tanto mais quanto maior o desgaste.
- **Auto-desaperto das porcas (efeito Junker):** calculado a partir da folga do
  escatel/chaveta e da rotação, e travado conforme o sistema de travamento
  escolhido.
- **Velocidade real possível vs. potencial** — a instabilidade obriga a abrandar.
- **Erro de registo (µm)** e **manchas de tinta (%)**, com uma **prova de cor**
  animada para três trabalhos de tolerância diferente (ObaniA, Bolachas,
  3 Pantones).
- **Refugo do lote (%)** e **aceitação do cliente** (OK / REJEITA).
- **Acumulado da tiragem:** metros perdidos, tempo gasto em reajustes e número
  de desapertos de anilhas.
- **Repartição da causa** dos metros perdidos entre **desgaste**, **manutenção**
  e **operador**.

A mensagem central: com peças em bom estado e uma montagem limpa, o registo
mantém-se dentro de tolerância e não há refugo — e é exatamente esse cenário que
a manutenção preventiva preserva.

## Medidas usadas no modelo

- Veio: Ø65 mm, comprimento 1920 mm
- Roda: abas Ø155 mm, calha Ø145 mm, largura 70 mm
- Cilindro: largura 850 mm, Ø 420 mm (perímetro variável 300–800 mm)
- Lado motor: peça fixa com escatel → bucha → cilindro
- Lado de fora: rosca → bucha → anilha → anilha

## Aviso

Ferramenta **didática**. As rotações de falha e os valores apresentados são
estimativas de um modelo simplificado, **não** um cálculo estrutural da máquina
real. Não usar para decisões de operação. Qualquer soltura em andamento deve ser
reportada à manutenção.

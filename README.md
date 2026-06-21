# Simulador — Corpo de Impressão Rotogravura

Simulação interativa 3D (web) que demonstra **os problemas causados por uma má
montagem de um cilindro de rotogravura e pela falta de manutenção preventiva ao
longo de um trabalho do dia a dia**.

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

## O que se pode fazer

A cena mostra o conjunto real — veio, rodas que assentam na meia-cana, motor do
lado motor, buchas, peça fixa com escatel/chaveta e, do lado de fora, a rosca
com as duas anilhas — e deixa-te:

- **Variar a velocidade** (rpm) e o **perímetro/Ø** do cilindro.
- **Introduzir defeitos** com severidade 0–100%, cada um identificado pela sua
  origem:
  - Chaveta mal assente — *operador*
  - Escatel gasto — *desgaste*
  - Alojamento alargado — *desgaste*
  - Anilhas desapertadas — *operador*
  - Folga nos rolamentos — *manutenção*
- **Escolher o travamento das anilhas** (nenhum → contra-porca → anilha freio →
  patilha dobrável → cavilha) e ver como resiste — ou não — à vibração.
- **Mudar de vista** (perspetiva, lado, lado motor, apoio na roda, vista
  explodida).

## O que a simulação calcula

Em tempo real, a partir dos defeitos e da velocidade, o painel estima:

- **Excentricidade e vibração** do conjunto e o estado (estável → crítico →
  falha).
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

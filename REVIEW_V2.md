# Review técnica — versão modernizada

## Resultado geral

A aplicação passou de uma experiência visual aplicada sobre o simulador legado para uma entrada moderna com arranque próprio através de módulos ES. O núcleo histórico continua preservado em `index.html`, mas `modern.html` é agora a entrada recomendada e carrega o simulador através de `src/bootstrap.js` e `src/simulator-loader.js`.

A versão moderna foi validada automaticamente em Chromium, sem erros JavaScript ou de consola, com Three.js r160 ativo.

## Alterações concluídas

### Interface

- shell visual moderno e responsivo para computador, tablet e telemóvel;
- navegação direta entre Montagem, Efeito Junker e Entupimento;
- painéis, cartões, botões, HUD, prova de impressão e controlos de câmara redesenhados;
- tipografia maior, melhor hierarquia visual e áreas de toque maiores;
- texto ampliado, ecrã inteiro e foco visível para teclado;
- campos numéricos sincronizados com os sliders técnicos principais;
- aviso claro de que os valores apresentados são tendências de um modelo didático.

### Sistemas de travamento

O antigo seletor abstrato foi substituído por cinco opções visuais:

1. sem travamento;
2. contra-porca;
3. anilhas de cunha;
4. anilha de patilha;
5. porca castelo com cavilha.

Foram corrigidas a terminologia e as resistências relativas do modelo. Cada opção passou a ter representação Three.js própria:

- uma ou duas porcas conforme o sistema;
- par de anilhas de cunha com elementos opostos;
- anilha com patilha dobrada;
- porca castelo e cavilha transversal;
- pequenos movimentos sincronizados com o nível de desaperto.

### Arquitetura

A entrada moderna deixou de depender diretamente do carregamento antigo:

- `src/bootstrap.js` coordena o arranque;
- `src/simulator-loader.js` prepara o simulador dentro do iframe;
- a interface moderna usa módulos ES;
- Three.js foi atualizado de r128 para r160 na experiência moderna;
- o simulador legado permanece preservado como fallback e fonte do conteúdo histórico.

Esta solução reduz o risco de regressão e cria uma fronteira clara para futuras extrações do núcleo.

### Documentação

- corrigida a confusão entre desenvolvimento de 420 mm e diâmetro;
- esclarecido que 420 mm de desenvolvimento corresponde a Ø aproximado de 133,7 mm;
- distinguido refugo físico, tempo de reajuste e perda de capacidade;
- reforçado que os valores absolutos não são medições estruturais da máquina;
- mantida a massa como referência fixa, conforme a decisão do projeto;
- não foram acrescentados custos em euros.

## Verificação funcional

O teste Playwright executado pelo workflow `Simulator smoke test` confirma:

- abertura de `modern.html`;
- carregamento do simulador dentro do iframe;
- ausência de erros JavaScript e erros de consola;
- funcionamento dos três módulos;
- existência e funcionamento dos cinco sistemas de travamento;
- instalação das geometrias visuais de travamento;
- funcionamento dos campos numéricos sincronizados;
- `THREE.REVISION === "160"`.

Resultado mais recente do GitHub Actions: **success**.

## Pontos ainda não resolvidos

### 1. Núcleo histórico ainda monolítico

O conteúdo interno de `index.html` continua a reunir HTML, CSS, criação Three.js, modelos de simulação, interface e previews 2D.

Isto já não bloqueia o arranque moderno, mas continua a limitar alterações profundas. A extração seguinte deve ser progressiva:

- modelo Junker;
- modelo de entupimento;
- criação da máquina;
- previews de impressão;
- constantes e parâmetros didáticos.

Não recomendo dividir as 1600 linhas de uma só vez. O correto é extrair um subsistema de cada vez, com testes antes e depois.

### 2. Modelos físicos empíricos

Os coeficientes de vibração, registo, refugo e resistência dos travamentos continuam a ser didáticos. A aplicação comunica agora melhor essa limitação, mas falta:

- concentrar os coeficientes num ficheiro de configuração;
- documentar a origem de cada valor;
- calibrar com observações reais, quando existirem dados suficientes.

### 3. Testes unitários

Existe validação de integração no browser, mas faltam testes unitários para:

- evolução do desaperto;
- monotonia da vibração com rpm e desgaste;
- limites de refugo;
- comportamento da cavilha e da patilha;
- entupimento, retardador, viscosidade e lavagem.

## Avaliação atualizada

### Finalidade e conteúdo técnico: 9/10

O projeto continua muito forte por combinar conhecimento real de rotogravura, mecânica, qualidade e formação numa ferramenta interativa pouco comum.

### Experiência visual: 8,5/10

A aplicação deixou de parecer um painel industrial antigo e passou a ter uma apresentação coerente com software técnico moderno. Ainda pode melhorar com transições de câmara próprias para cada travamento e modelos 3D mais detalhados.

### Organização do código: 6,5/10

A entrada moderna, os estilos, o carregador, os testes e a documentação estão separados. O núcleo histórico continua monolítico, pelo que a nota ainda não pode ser mais alta.

### Fiabilidade: 8/10

A aplicação tem agora um teste real em Chromium, validação dos principais fluxos, vigilância de erros e confirmação da versão do Three.js.

### Manutenção futura: 7/10

A fronteira entre experiência moderna e núcleo legado permite continuar a evoluir sem mexer em tudo ao mesmo tempo. A manutenção ficará sólida quando os modelos de simulação forem extraídos e cobertos por testes unitários.

## Conclusão

A versão modernizada está funcional e validada. O PR pode avançar para integração do ponto de vista de interface, navegação, travamentos e carregamento moderno.

A próxima fase já não deve ser mais redesign. Deve ser refatoração interna progressiva, começando pelo modelo Junker e pelos parâmetros físicos, sempre protegida por testes.
# Review técnica — versão modernizada

## Resultado geral

A aplicação mantém o simulador original em `index.html` e acrescenta uma experiência moderna através de `modern.html`. Esta estratégia reduz o risco de regressão porque a cena, as animações e os modelos didáticos existentes continuam intactos.

## Alterações concluídas

### Interface

- novo shell visual responsivo para computador, tablet e telemóvel;
- navegação direta entre os três módulos;
- painéis, cartões, botões, HUD, prova de impressão e controlos de câmara modernizados;
- tipografia maior e hierarquia visual mais clara;
- opção de texto ampliado e ecrã inteiro;
- áreas de toque aumentadas e foco visível para teclado;
- campos numéricos sincronizados com os sliders técnicos principais.

### Sistemas de travamento

O antigo slider abstrato foi substituído por cinco cartões:

1. sem travamento;
2. contra-porca;
3. anilhas de cunha;
4. anilha de patilha;
5. porca castelo com cavilha.

Foram corrigidas a terminologia e as resistências relativas do modelo. Cada opção passou a ter geometria Three.js própria:

- uma ou duas porcas conforme o sistema;
- par de anilhas de cunha com elementos visuais opostos;
- anilha e patilha dobrada;
- coroa de porca castelo e cavilha transversal;
- pequenos movimentos sincronizados com o nível de desaperto.

### Documentação

- corrigida a confusão entre desenvolvimento de 420 mm e diâmetro;
- esclarecido que 420 mm de desenvolvimento corresponde a Ø aproximado de 133,7 mm;
- distinguido refugo físico, tempo de reajuste e perda de capacidade como conceitos pedagógicos;
- reforçado que os valores absolutos são tendências, não medições estruturais.

### Verificação

Foi acrescentado um teste Playwright que:

- abre `modern.html`;
- vigia erros JavaScript e erros de consola;
- confirma o carregamento do iframe;
- percorre Montagem, Efeito Junker e Entupimento;
- confirma os cinco cartões de travamento;
- seleciona cada sistema e valida o valor aplicado;
- confirma a instalação do módulo visual de travamento;
- confirma a existência dos novos campos numéricos.

O workflow `.github/workflows/smoke-test.yml` executa este teste em Chromium no GitHub Actions.

## Pontos ainda não resolvidos

### 1. Ficheiro principal monolítico

O `index.html` continua a concentrar HTML, CSS, Three.js, simulação, interface e canvas 2D. A interface moderna reduz o problema visível, mas não substitui a refatoração arquitetural.

Próxima alteração recomendada:

- extrair o modelo Junker;
- extrair o modelo de entupimento;
- extrair a criação da máquina;
- extrair previews de impressão;
- migrar gradualmente para módulos ES.

### 2. Three.js antigo

A aplicação base continua a usar Three.js r128 através de CDN. A migração para uma versão moderna deve ser feita num PR próprio porque pode alterar materiais, geometrias, cores e comportamento do renderer.

### 3. Modelos empíricos

As constantes de vibração, registo, refugo e resistência dos travamentos continuam a ser coeficientes didáticos. Estão agora descritas com maior honestidade, mas ainda devem ser extraídas para um ficheiro de configuração e, idealmente, calibradas com observações reais.

### 4. Massa do cilindro

Não foi transformada numa variável porque os cilindros considerados pelo projeto são equivalentes. Mantém-se uma referência fixa, conforme a decisão do proprietário do projeto.

### 5. Custos em euros

Não foram acrescentados porque não pertencem ao objetivo atual da aplicação.

## Nova avaliação

### Finalidade e conteúdo técnico: 9/10

O projeto continua muito forte por combinar conhecimento específico de rotogravura, mecânica, qualidade e formação.

### Experiência visual: 8/10

A nova interface é claramente mais moderna e legível. Ainda pode melhorar com modelos 3D mais detalhados, transições de câmara específicas para cada travamento e ilustrações no menu inicial.

### Organização do código: 5/10

Melhorou através da separação da interface moderna, estilos, testes e documentação, mas o núcleo continua monolítico.

### Fiabilidade: 7/10

Passa a existir uma verificação automática de carregamento e navegação. Faltam testes unitários dos cálculos físicos e de produção.

### Manutenção futura: 6/10

Já é possível evoluir a UI e os sistemas de travamento sem tocar diretamente na cena base. A manutenção só ficará realmente sólida após a separação do `index.html` em módulos.

## Recomendação de integração

Integrar apenas quando o workflow `Simulator smoke test` estiver verde. Manter o PR em rascunho enquanto a validação automática não terminar.
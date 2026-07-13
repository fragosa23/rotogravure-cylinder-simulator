# Referência dos modelos

## Estado comum

| Campo | Unidade | Intervalo |
|---|---:|---:|
| `speed` | rpm | 0–600 |
| `keyIn`, `keyOut` | % | 0–100 |
| `slot`, `tab`, `seat`, `nut`, `bal` | % | 0–100 |
| `lock` | índice | 0–4 |
| `dia` | mm de desenvolvimento | 300–800 |
| `health` | % | 0–100 |

## Modelo Junker

### Entradas

- estado mecânico;
- desaperto acumulado;
- rotação de referência e tolerância definidos na configuração.

### Resultados

- `ecc`: índice didático expresso como mm equivalentes;
- `vib`: severidade 0–100%;
- `sp`: rotação normalizada;
- `nutEff`: desaperto efetivo;
- `massF`: fator relativo de massa;
- taxa de desaperto;
- taxa de dano mecânico.

## Produção e qualidade

### Entradas

- estado mecânico;
- desaperto acumulado;
- vibração;
- tolerância do trabalho;
- intervalo de tempo.

### Resultados

- velocidade atual estimada;
- erro de registo;
- manchas/falhas;
- refugo;
- rejeição;
- repartição de causas;
- metros de refugo;
- capacidade equivalente não produzida;
- minutos e eventos de reajuste.

## Entupimento

### Entradas

- rpm;
- viscosidade e alvo da tinta;
- retardador;
- sujidade;
- pressão, ângulo e altura da raclete;
- vai-vem;
- entupimento atual;
- intervalo de tempo.

### Resultados

- taxa de secagem;
- janela de secagem;
- taxa e nível de entupimento;
- ângulo efetivo;
- véu e riscos;
- diluição e excesso de retardador;
- refugo e classificação de qualidade.

## Limitações

Os resultados são tendências didáticas calibradas para demonstrar relações de causa e efeito. Não são medições metrológicas, ensaios de fixação certificados nem previsões contratuais de produção.
# Painel Censo 2022 — Áreas de Ponderação

Versão estática compacta para GitHub Pages.

## Instalação
Extraia o ZIP e envie seu conteúdo para a raiz do repositório. O ZIP não deve ser enviado como um arquivo do site.

## Dados
Os 12 blocos temáticos estão em dados/pacotes/*.json.gz. As geometrias estão em dados/geo/pacotes/. O índice dados/pacotes/index.json resolve os caminhos usados pela aplicação. Os arquivos são descomprimidos no navegador, sem servidor ou Git LFS.

Os 136 indicadores, os 14.270 registros analíticos de AP, os totais, as contagens, os valores nulos e os metadados são preservados. As geometrias não são simplificadas novamente. Os arquivos de auditoria internos não são publicados.

Fonte: IBGE, Censo Demográfico 2022 — Resultados Gerais da Amostra por Áreas de Ponderação.

## Metodologia
Consulte a aba Metodologia do painel para definições, regras de agregação e cobertura. Médias e medianas seguem as restrições documentadas nos metadados.

## Compatibilidade
O carregamento GZIP utiliza DecompressionStream. É necessário um navegador atualizado. A visualização de todas as APs do Brasil ainda pode exigir memória e tempo consideráveis.

# Sistema de Filtragem de Produtividade

Sistema web para análise e filtragem de dados de produtividade de equipes operacionais a partir de arquivos CSV.

## Funcionalidades

- **Carregamento de CSV**: Suporte para arquivos CSV com separadores de tabulação
- **Filtros Inteligentes**: 4 condições configuráveis de filtragem
- **Visualizações Múltiplas**: Tabela e cards para visualização dos dados
- **Exportação**: Exportar dados filtrados para CSV
- **Estatísticas**: Resumo detalhado da análise
- **Interface Responsiva**: Funciona em desktop e dispositivos móveis

## Condições de Filtragem

1. **Ação diferente de "-"**: Equipes com alguma ação registrada
2. **1º Desp > 10**: Tempo do primeiro despacho superior a 10 minutos
3. **1º Desl > 25**: Tempo do primeiro deslocamento superior a 25 minutos
4. **1º Login > 5**: Tempo do primeiro login superior a 5 minutos

## Como Usar

1. **Carregar Dados**:
   - Clique em "Selecione o Arquivo" ou arraste um arquivo CSV para a área indicada
   - O sistema suporta arquivos CSV com separadores de tabulação

2. **Configurar Filtros**:
   - Ative/desative os filtros clicando nos cards de condições
   - Cada filtro pode ser configurado individualmente

3. **Processar Dados**:
   - Clique em "Processar Dados" para aplicar os filtros
   - Os resultados serão exibidos automaticamente

4. **Exportar Resultados**:
   - Após o processamento, clique em "Exportar CSV" para baixar os dados filtrados

5. **Alternar Visualização**:
   - Use o botão "Alternar Visualização" para mudar entre tabela e cards

## Estrutura do Projeto

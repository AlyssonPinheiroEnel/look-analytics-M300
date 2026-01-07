// Main application module - Versão auto-carregável
import { CSVLoader } from './csvLoader.js';
import { DataFilter } from './dataFilter.js';
import { UIManager } from './uiManager.js';

class ProdutividadeApp {
    constructor() {
        this.csvLoader = new CSVLoader();
        this.dataFilter = new DataFilter();
        this.uiManager = new UIManager();
        
        this.rawData = [];
        this.filteredData = [];
        this.filters = {
            cond1: true, // Ação diferente de "-"
            cond2: true, // 1º Desp > 10
            cond3: true, // 1º Desl > 25
            cond4: true  // 1º Login > 5
        };
        
        this.autoRefreshInterval = null;
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        this.uiManager.generateFilterCards(this.filters);
        this.uiManager.showMessage('Carregando dados do CSV...', 'loading');
        
        // Carrega dados automaticamente ao iniciar
        await this.loadData();
        
        // Inicia verificação automática
        this.startAutoRefresh();
    }
    
    bindEvents() {
        // Botão de atualização
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        
        // Botão de reset/toggle filters
        document.getElementById('toggleAllFilters').addEventListener('click', () => this.toggleAllFilters());
        
        // Toggle view button
        document.getElementById('toggleViewBtn').addEventListener('click', () => this.uiManager.toggleView());
        
        // Modal close events
        document.querySelector('.modal-close').addEventListener('click', () => this.uiManager.hideModal());
        document.getElementById('closeErrorModal').addEventListener('click', () => this.uiManager.hideModal());
        
        // Filter toggle events
        document.getElementById('filtersContainer').addEventListener('click', (e) => {
            const filterCard = e.target.closest('.filter-card');
            if (filterCard) {
                const filterId = filterCard.dataset.filter;
                this.toggleFilter(filterId);
            }
        });
    }
    
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.uiManager.showLoading();
        this.uiManager.showMessage('Carregando dados do CSV...', 'loading');
        
        try {
            // Carrega CSV automaticamente
            this.rawData = await this.csvLoader.loadCSV();
            
            // Valida os dados
            const validation = this.csvLoader.validateData(this.rawData);
            
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            
            // Atualiza informações do arquivo
            const fileInfo = this.csvLoader.getFileInfo();
            this.uiManager.updateFileInfo(fileInfo);
            
            // Aplica filtros
            this.applyFilters();
            
            // Atualiza UI com sucesso
            this.uiManager.hideMessage();
            this.uiManager.showMessage(`Dados carregados: ${this.rawData.length} registros encontrados`, 'success');
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            
            // Mostra mensagem de erro detalhada
            this.uiManager.showMessage(`Erro ao carregar CSV: ${error.message}`, 'error');
            
            // Se for erro 404, sugere criar o arquivo
            if (error.message.includes('não encontrado')) {
                this.uiManager.showError(`
                    Arquivo CSV não encontrado em: <code>${this.csvLoader.csvUrl}</code>
                    <br><br>
                    <strong>Solução:</strong>
                    <ol>
                        <li>Crie um arquivo CSV na pasta <code>/data/</code></li>
                        <li>Nomeie-o como <code>dados.csv</code></li>
                        <li>Certifique-se que tem os cabeçalhos corretos</li>
                        <li>Faça commit e push para o GitHub</li>
                    </ol>
                `);
            }
            
            // Define dados vazios para evitar erros
            this.rawData = [];
            this.filteredData = [];
            this.uiManager.updateTable([]);
            this.uiManager.updateCards([]);
            this.uiManager.updateStats(0, 0);
            
        } finally {
            this.isLoading = false;
            this.uiManager.hideLoading();
            
            // Atualiza timestamp
            this.uiManager.updateLastCheck();
        }
    }
    
    applyFilters() {
        if (this.rawData.length === 0) {
            this.filteredData = [];
            return;
        }
        
        // Aplica filtros ativos
        this.filteredData = this.dataFilter.applyFilters(this.rawData, this.filters);
        
        // Atualiza UI
        this.uiManager.updateTable(this.filteredData);
        this.uiManager.updateCards(this.filteredData);
        this.uiManager.updateStats(this.rawData.length, this.filteredData.length);
        this.uiManager.updateSummary(this.rawData, this.filteredData, this.filters);
        this.uiManager.updateResultsCount(this.filteredData.length);
    }
    
    async refreshData() {
        console.log('Verificando atualizações...');
        this.uiManager.showMessage('Verificando atualizações no CSV...', 'loading');
        
        try {
            // Força recarregamento ignorando cache
            this.csvLoader.clearCache();
            await this.loadData();
            
        } catch (error) {
            console.error('Erro ao atualizar:', error);
        }
    }
    
    toggleFilter(filterId) {
        this.filters[filterId] = !this.filters[filterId];
        this.uiManager.updateFilterCard(filterId, this.filters[filterId]);
        this.applyFilters();
    }
    
    toggleAllFilters() {
        const allActive = Object.values(this.filters).every(v => v);
        
        // Inverte todos os filtros
        Object.keys(this.filters).forEach(key => {
            this.filters[key] = !allActive;
        });
        
        // Atualiza UI
        this.uiManager.generateFilterCards(this.filters);
        this.applyFilters();
    }
    
    startAutoRefresh() {
        // Verifica atualizações a cada 5 minutos
        this.autoRefreshInterval = setInterval(async () => {
            try {
                const hasUpdates = await this.csvLoader.checkForUpdates();
                if (hasUpdates) {
                    console.log('Atualização detectada, recarregando...');
                    await this.loadData();
                }
            } catch (error) {
                console.error('Erro na verificação automática:', error);
            }
        }, 300000); // 5 minutos
    }
    
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }
    
    // Para debugging: expõe dados na console
    debug() {
        console.log('=== DEBUG INFO ===');
        console.log('Raw Data:', this.rawData);
        console.log('Filtered Data:', this.filteredData);
        console.log('Active Filters:', this.filters);
        console.log('File Info:', this.csvLoader.getFileInfo());
        console.log('=================');
    }
}

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ProdutividadeApp();
    
    // Para debugging: expõe métodos úteis
    window.debugApp = () => window.app.debug();
});
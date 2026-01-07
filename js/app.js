// Main application module - Versão com suporte a servidor
import { CSVParser } from './csvParser.js';
import { DataFilter } from './dataFilter.js';
import { UIManager } from './uiManager.js';

class ProdutividadeApp {
    constructor() {
        this.csvParser = new CSVParser();
        this.dataFilter = new DataFilter();
        this.uiManager = new UIManager();
        
        this.rawData = [];
        this.filteredData = [];
        this.filters = {
            cond1: true,
            cond2: true,
            cond3: true,
            cond4: true
        };
        
        this.serverURL = window.location.origin;
        this.useServer = false;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        this.uiManager.generateFilterCards(this.filters);
        this.uiManager.updateStats(0, 0);
        
        // Verifica se o servidor está disponível
        await this.checkServer();
        
        // Carrega lista de arquivos do servidor se disponível
        if (this.useServer) {
            await this.loadServerFiles();
        }
    }
    
    async checkServer() {
        try {
            const response = await fetch(`${this.serverURL}/api/health`);
            if (response.ok) {
                const data = await response.json();
                console.log('Servidor conectado:', data);
                this.useServer = true;
                this.uiManager.showMessage('Servidor conectado', 'success');
            }
        } catch (error) {
            console.log('Usando modo local (servidor offline)');
            this.useServer = false;
        }
    }
    
    async loadServerFiles() {
        try {
            const response = await fetch(`${this.serverURL}/api/files`);
            if (response.ok) {
                const files = await response.json();
                this.uiManager.updateServerFilesList(files);
            }
        } catch (error) {
            console.error('Erro ao carregar arquivos do servidor:', error);
        }
    }
    
    bindEvents() {
        // File upload events
        document.getElementById('csvFile').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFileDrop(e);
        });
        
        // Process button
        document.getElementById('processBtn').addEventListener('click', () => this.processData());
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => this.resetApp());
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        
        // Toggle view button
        document.getElementById('toggleViewBtn').addEventListener('click', () => this.uiManager.toggleView());
        
        // Modal close events
        document.querySelector('.modal-close')?.addEventListener('click', () => this.uiManager.hideErrorModal());
        document.getElementById('closeErrorModal')?.addEventListener('click', () => this.uiManager.hideErrorModal());
        
        // Filter toggle events
        document.getElementById('filtersContainer')?.addEventListener('click', (e) => {
            const filterCard = e.target.closest('.filter-card');
            if (filterCard && !filterCard.classList.contains('disabled')) {
                const filterId = filterCard.dataset.filter;
                this.toggleFilter(filterId);
            }
        });
        
        // Server file selection (se implementado)
        document.getElementById('serverFilesList')?.addEventListener('change', (e) => {
            this.loadFileFromServer(e.target.value);
        });
    }
    
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            await this.loadFile(file);
            
            // Opcional: enviar para o servidor
            if (this.useServer) {
                await this.uploadToServer(file);
            }
        }
    }
    
    async handleFileDrop(event) {
        const file = event.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            await this.loadFile(file);
            
            if (this.useServer) {
                await this.uploadToServer(file);
            }
        } else {
            this.uiManager.showError('Por favor, selecione um arquivo CSV válido.');
        }
    }
    
    async loadFile(file) {
        try {
            this.uiManager.showLoading();
            this.uiManager.updateFileInfo(file.name, file.size);
            
            const content = await this.csvParser.readFile(file);
            this.rawData = this.csvParser.parse(content);
            
            document.getElementById('processBtn').disabled = false;
            this.uiManager.hideLoading();
            
        } catch (error) {
            this.uiManager.showError(`Erro ao carregar arquivo: ${error.message}`);
            this.uiManager.hideLoading();
        }
    }
    
    async uploadToServer(file) {
        try {
            const fileContent = await this.csvParser.readFile(file);
            
            const response = await fetch(`${this.serverURL}/api/upload?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/csv'
                },
                body: fileContent
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Arquivo enviado para o servidor:', result);
                
                // Atualiza a lista de arquivos
                await this.loadServerFiles();
            }
        } catch (error) {
            console.error('Erro ao enviar para servidor:', error);
        }
    }
    
    async loadFileFromServer(filename) {
        if (!filename) return;
        
        try {
            this.uiManager.showLoading();
            
            const response = await fetch(`${this.serverURL}/api/file/${encodeURIComponent(filename)}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Processa o conteúdo do arquivo
                this.rawData = this.csvParser.parse(data.content);
                this.uiManager.updateFileInfo(filename, data.size);
                document.getElementById('processBtn').disabled = false;
                
                this.uiManager.hideLoading();
            } else {
                throw new Error('Erro ao carregar arquivo do servidor');
            }
        } catch (error) {
            this.uiManager.showError(`Erro: ${error.message}`);
            this.uiManager.hideLoading();
        }
    }
    
    processData() {
        try {
            this.uiManager.showLoading();
            
            // Usa processamento no servidor se disponível
            if (this.useServer) {
                this.processDataOnServer();
            } else {
                // Processamento local
                this.filteredData = this.dataFilter.applyFilters(this.rawData, this.filters);
                this.updateUI();
            }
            
        } catch (error) {
            this.uiManager.showError(`Erro ao processar dados: ${error.message}`);
            this.uiManager.hideLoading();
        }
    }
    
    async processDataOnServer() {
        try {
            const response = await fetch(`${this.serverURL}/api/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: this.rawData,
                    filters: this.filters
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.filteredData = result.data;
                this.updateUI();
                this.uiManager.hideLoading();
            } else {
                throw new Error('Erro no processamento do servidor');
            }
        } catch (error) {
            // Fallback para processamento local
            console.warn('Falha no servidor, usando processamento local:', error);
            this.filteredData = this.dataFilter.applyFilters(this.rawData, this.filters);
            this.updateUI();
            this.uiManager.hideLoading();
        }
    }
    
    updateUI() {
        this.uiManager.updateTable(this.filteredData);
        this.uiManager.updateCards(this.filteredData);
        this.uiManager.updateStats(this.rawData.length, this.filteredData.length);
        this.uiManager.updateSummary(this.rawData, this.filteredData, this.filters);
        
        document.getElementById('exportBtn').disabled = this.filteredData.length === 0;
        this.uiManager.hideLoading();
    }
    
    toggleFilter(filterId) {
        this.filters[filterId] = !this.filters[filterId];
        this.uiManager.updateFilterCard(filterId, this.filters[filterId]);
        
        if (this.rawData.length > 0) {
            this.processData();
        }
    }
    
    async exportToCSV() {
        if (this.filteredData.length === 0) return;
        
        const headers = ['Equipe', 'Login', 'Inicio Calendário', 'Ação', 'Status Desloc', '1º Login', '1º Desp', '1º Desl'];
        const csvContent = this.csvParser.convertToCSV(this.filteredData, headers);
        const filename = `equipes_filtradas_${new Date().toISOString().slice(0, 10)}.csv`;
        
        // Tenta exportar via servidor primeiro
        if (this.useServer) {
            try {
                const response = await fetch(`${this.serverURL}/api/export`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        data: csvContent,
                        filename: filename
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Abre o download
                    window.open(`${this.serverURL}/api/download/${filename}`, '_blank');
                    return;
                }
            } catch (error) {
                console.warn('Falha ao exportar no servidor, usando método local:', error);
            }
        }
        
        // Método local (fallback)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    resetApp() {
        this.rawData = [];
        this.filteredData = [];
        
        this.filters = {
            cond1: true,
            cond2: true,
            cond3: true,
            cond4: true
        };
        
        this.uiManager.resetUI();
        this.uiManager.updateStats(0, 0);
        this.uiManager.generateFilterCards(this.filters);
        
        document.getElementById('csvFile').value = '';
        document.getElementById('processBtn').disabled = true;
        document.getElementById('exportBtn').disabled = true;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ProdutividadeApp();
});
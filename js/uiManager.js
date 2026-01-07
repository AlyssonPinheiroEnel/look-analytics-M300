// UI Manager module - Versão corrigida
import { DataFilter } from './dataFilter.js';

export class UIManager {
    constructor() {
        this.dataFilter = new DataFilter();
        this.currentView = 'table'; // 'table' ou 'cards'
    }

    // Métodos de loading
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('dataMessage');
        const iconClass = this.getMessageIcon(type);
        
        messageDiv.innerHTML = `
            <div class="message-content ${type}">
                <i class="fas ${iconClass}"></i>
                ${message}
            </div>
        `;
        messageDiv.classList.add('active', type);
    }

    hideMessage() {
        const messageDiv = document.getElementById('dataMessage');
        messageDiv.classList.remove('active', 'loading', 'error', 'success');
        messageDiv.innerHTML = '';
    }

    getMessageIcon(type) {
        const icons = {
            loading: 'fa-spinner fa-spin',
            error: 'fa-exclamation-triangle',
            success: 'fa-check-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    // Métodos de informação do arquivo
    updateFileInfo(fileInfo) {
        document.getElementById('csvFileName').textContent = fileInfo.fileName;
        document.getElementById('lastUpdate').textContent = fileInfo.lastLoaded || 'Agora';
        
        // Atualiza estatísticas do arquivo
        const fileSizeKB = Math.round(fileInfo.fileSize / 1024);
        document.getElementById('lastCheck').textContent = 
            `${fileInfo.lastLoaded} (${fileInfo.rowCount} linhas, ${fileSizeKB} KB)`;
    }

    updateLastCheck() {
        const now = new Date().toLocaleString('pt-BR');
        document.getElementById('lastCheck').textContent = now;
    }

    updateResultsCount(count) {
        document.getElementById('resultsCount').textContent = 
            `${count} resultado${count !== 1 ? 's' : ''}`;
    }

    // Métodos de modal
    showError(detailedMessage) {
        const modal = document.getElementById('errorModal');
        document.getElementById('errorMessage').innerHTML = detailedMessage;
        modal.classList.add('active');
    }

    hideModal() {
        document.getElementById('errorModal').classList.remove('active');
    }

    // Métodos de filtros
    generateFilterCards(filters) {
        const container = document.getElementById('filtersContainer');
        const conditions = this.dataFilter.conditions;
        
        container.innerHTML = Object.entries(conditions).map(([id, condition]) => `
            <div class="filter-card ${filters[id] ? 'active' : ''}" data-filter="${id}">
                <div class="filter-header">
                    <div class="filter-icon ${id.replace('cond', '')}">
                        <i class="fas fa-${this.getFilterIcon(id)}"></i>
                    </div>
                    <div>
                        <h4 class="filter-title">${condition.name}</h4>
                        <p class="filter-description">${condition.description}</p>
                    </div>
                </div>
                <div class="filter-status">
                    ${filters[id] ? '<i class="fas fa-check"></i> Ativo' : '<i class="fas fa-times"></i> Inativo'}
                </div>
            </div>
        `).join('');
    }

    getFilterIcon(filterId) {
        const icons = {
            cond1: 'exclamation-triangle',
            cond2: 'clock',
            cond3: 'car',
            cond4: 'sign-in-alt'
        };
        return icons[filterId] || 'filter';
    }

    updateFilterCard(filterId, isActive) {
        const card = document.querySelector(`[data-filter="${filterId}"]`);
        if (card) {
            card.classList.toggle('active', isActive);
            const status = card.querySelector('.filter-status');
            if (status) {
                status.innerHTML = isActive ? 
                    '<i class="fas fa-check"></i> Ativo' : 
                    '<i class="fas fa-times"></i> Inativo';
            }
        }
    }

    // Métodos de tabela
    updateTable(data) {
        const tbody = document.getElementById('tableBody');
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: #95a5a6;">
                        <i class="fas fa-database fa-2x" style="margin-bottom: 1rem;"></i>
                        <p>Nenhum dado encontrado com os filtros atuais</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.map(row => {
            // Formata valores
            const acao = row['Ação'] || '-';
            const primeiroLogin = this.dataFilter.formatValue(row['1º Login']);
            const primeiroDesp = this.dataFilter.formatValue(row['1º Desp']);
            const primeiroDesl = this.dataFilter.formatValue(row['1º Desl.']);
            
            // Obtém classes de destaque
            const acaoClass = acao !== '-' && acao !== '' ? 
                (acao === 'Login Atrasado' ? 'login-atrasado' : 'highlight-action') : '';
            
            const primeiroLoginClass = this.dataFilter.getHighlightClass(row['1º Login'], 'cond4');
            const primeiroDespClass = this.dataFilter.getHighlightClass(row['1º Desp'], 'cond2');
            const primeiroDeslClass = this.dataFilter.getHighlightClass(row['1º Desl.'], 'cond3');
            
            return `
                <tr data-equipe="${row['Equipe'] || ''}">
                    <td><strong>${row['Equipe'] || ''}</strong></td>
                    <td class="${row['Login'] === '(Empty)' || !row['Login'] ? 'empty-cell' : ''}">
                        ${row['Login'] || ''}
                    </td>
                    <td>${row['Inicio Calendário'] || ''}</td>
                    <td>
                        ${acaoClass ? `<span class="${acaoClass}">${acao}</span>` : acao}
                    </td>
                    <td class="${row['Status Desloc'] === '(Empty)' || !row['Status Desloc'] ? 'empty-cell' : ''}">
                        ${row['Status Desloc'] || ''}
                    </td>
                    <td class="${primeiroLogin.isEmpty ? 'empty-cell' : ''}">
                        ${primeiroLoginClass ? `<span class="${primeiroLoginClass}">${primeiroLogin.text}</span>` : primeiroLogin.text}
                    </td>
                    <td class="${primeiroDesp.isEmpty ? 'empty-cell' : ''}">
                        ${primeiroDespClass ? `<span class="${primeiroDespClass}">${primeiroDesp.text}</span>` : primeiroDesp.text}
                    </td>
                    <td class="${primeiroDesl.isEmpty ? 'empty-cell' : ''}">
                        ${primeiroDeslClass ? `<span class="${primeiroDeslClass}">${primeiroDesl.text}</span>` : primeiroDesl.text}
                    </td>
                </tr>
            `;
        }).join('');
        
        // Adiciona handlers de clique
        this.addTableRowHandlers();
    }

    // Métodos de cards
    updateCards(data) {
        const container = document.getElementById('cardsContainer');
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-database fa-3x" style="color: #95a5a6; margin-bottom: 1rem;"></i>
                    <p>Nenhum dado encontrado com os filtros atuais</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.map(row => {
            const conditions = this.dataFilter.getRowConditions(row);
            const conditionLabels = conditions.map(c => 
                `<span class="condition-tag" style="background-color: ${c.color}20; color: ${c.color}; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin: 2px;">
                    ${c.name}
                </span>`
            ).join('');
            
            return `
                <div class="team-card">
                    <div class="team-header">
                        <div class="team-name">${row['Equipe'] || ''}</div>
                        <div class="team-status">
                            ${conditions.length} condiç${conditions.length === 1 ? 'ão' : 'ões'}
                        </div>
                    </div>
                    
                    <div class="team-details">
                        <div class="detail-item">
                            <span class="detail-label">Login:</span>
                            <span class="detail-value">${row['Login'] || ''}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Início:</span>
                            <span class="detail-value">${row['Inicio Calendário'] || ''}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Ação:</span>
                            <span class="detail-value ${row['Ação'] !== '-' ? 'highlight-action' : ''}">
                                ${row['Ação'] || '-'}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">${row['Status Desloc'] || ''}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">1º Login:</span>
                            <span class="detail-value ${this.dataFilter.getHighlightClass(row['1º Login'], 'cond4')}">
                                ${row['1º Login'] || ''}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">1º Desp:</span>
                            <span class="detail-value ${this.dataFilter.getHighlightClass(row['1º Desp'], 'cond2')}">
                                ${row['1º Desp'] || ''}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">1º Desl:</span>
                            <span class="detail-value ${this.dataFilter.getHighlightClass(row['1º Desl.'], 'cond3')}">
                                ${row['1º Desl.'] || ''}
                            </span>
                        </div>
                    </div>
                    
                    <div class="team-conditions" style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 4px;">
                        ${conditionLabels}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Métodos de estatísticas
    updateStats(total, filtered) {
        document.getElementById('totalTeams').textContent = total;
        document.getElementById('filteredTeams').textContent = filtered;
    }

    updateSummary(rawData, filteredData, filters) {
        const summaryContent = document.getElementById('summaryContent');
        
        if (rawData.length === 0) {
            summaryContent.innerHTML = '<p>Carregue um arquivo CSV para começar a análise.</p>';
            return;
        }
        
        // Calcula estatísticas
        const activeFilters = Object.values(filters).filter(Boolean).length;
        const filterPercentage = rawData.length > 0 ? 
            ((filteredData.length / rawData.length) * 100).toFixed(1) : 0;
        
        // Conta por condição
        const conditionCounts = {
            cond1: 0,
            cond2: 0,
            cond3: 0,
            cond4: 0
        };
        
        filteredData.forEach(row => {
            Object.keys(conditionCounts).forEach(condId => {
                if (this.dataFilter.conditions[condId].check(row)) {
                    conditionCounts[condId]++;
                }
            });
        });
        
        summaryContent.innerHTML = `
            <div class="summary-stats" style="display: flex; justify-content: space-around; margin-bottom: 1rem;">
                <div class="stat-item" style="text-align: center;">
                    <div class="stat-number" style="font-size: 1.5rem; font-weight: bold; color: #2c3e50;">${filteredData.length}</div>
                    <div class="stat-label" style="font-size: 0.8rem; color: #7f8c8d;">Equipes Filtradas</div>
                </div>
                <div class="stat-item" style="text-align: center;">
                    <div class="stat-number" style="font-size: 1.5rem; font-weight: bold; color: #2c3e50;">${filterPercentage}%</div>
                    <div class="stat-label" style="font-size: 0.8rem; color: #7f8c8d;">Percentual</div>
                </div>
                <div class="stat-item" style="text-align: center;">
                    <div class="stat-number" style="font-size: 1.5rem; font-weight: bold; color: #2c3e50;">${activeFilters}/4</div>
                    <div class="stat-label" style="font-size: 0.8rem; color: #7f8c8d;">Filtros Ativos</div>
                </div>
            </div>
            
            <div class="condition-breakdown">
                <h4 style="margin: 1rem 0 0.5rem; color: #2c3e50; font-size: 0.9rem;">Distribuição por Condição:</h4>
                <div class="breakdown-list" style="font-size: 0.8rem;">
                    ${Object.entries(conditionCounts).map(([id, count]) => `
                        <div class="breakdown-item" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span class="breakdown-color" style="width: 12px; height: 12px; border-radius: 50%; background-color: ${this.dataFilter.conditions[id].color}"></span>
                            <span class="breakdown-name" style="flex: 1;">${this.dataFilter.conditions[id].name}:</span>
                            <span class="breakdown-count" style="font-weight: bold;">${count} equipes</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Métodos de visualização
    toggleView() {
        const tableView = document.getElementById('tableView');
        const cardsView = document.getElementById('cardsView');
        const toggleBtn = document.getElementById('toggleViewBtn');
        
        if (this.currentView === 'table') {
            tableView.style.display = 'none';
            cardsView.style.display = 'block';
            this.currentView = 'cards';
            toggleBtn.innerHTML = '<i class="fas fa-table"></i> Visualização em Tabela';
        } else {
            tableView.style.display = 'block';
            cardsView.style.display = 'none';
            this.currentView = 'table';
            toggleBtn.innerHTML = '<i class="fas fa-th-large"></i> Visualização em Cards';
        }
    }

    // Handlers de interação
    addTableRowHandlers() {
        const rows = document.querySelectorAll('#tableBody tr');
        
        rows.forEach(row => {
            row.addEventListener('click', () => {
                // Remove highlight de todas as linhas
                rows.forEach(r => r.style.backgroundColor = '');
                
                // Destaca linha clicada
                row.style.backgroundColor = '#f0f7ff';
            });
        });
    }

    // Reset UI
    resetUI() {
        // Limpa tabela
        document.getElementById('tableBody').innerHTML = '';
        
        // Limpa cards
        document.getElementById('cardsContainer').innerHTML = '';
        
        // Limpa mensagens
        this.hideMessage();
        
        // Limpa resumo
        document.getElementById('summaryContent').innerHTML = 
            '<p>Carregue um arquivo CSV para começar a análise.</p>';
        
        // Reseta para visualização em tabela
        this.currentView = 'table';
        document.getElementById('tableView').style.display = 'block';
        document.getElementById('cardsView').style.display = 'none';
        document.getElementById('toggleViewBtn').innerHTML = 
            '<i class="fas fa-th-large"></i> Cards';
        
        // Reseta contadores
        this.updateStats(0, 0);
        this.updateResultsCount(0);
    }
}
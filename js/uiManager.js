// UI Manager module
import { DataFilter } from './dataFilter.js';

export class UIManager {
    constructor() {
        this.dataFilter = new DataFilter();
        this.currentView = 'table'; // 'table' or 'cards'
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').classList.add('active');
    }
    
    hideErrorModal() {
        document.getElementById('errorModal').classList.remove('active');
    }
    
    updateFileInfo(fileName, fileSize) {
        const fileInfo = document.getElementById('fileInfo');
        const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        
        fileInfo.innerHTML = `
            <div class="file-details">
                <strong><i class="fas fa-file-csv"></i> ${fileName}</strong>
                <span class="file-size">${sizeMB} MB</span>
            </div>
            <div class="file-status">
                <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                Arquivo carregado com sucesso
            </div>
        `;
        
        fileInfo.classList.add('active');
    }
    
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
            const conditions = this.dataFilter.getRowConditions(row);
            
            // Format values
            const acao = row['Ação'] || '-';
            const primeiroLogin = this.dataFilter.formatValue(row['1º Login']);
            const primeiroDesp = this.dataFilter.formatValue(row['1º Desp']);
            const primeiroDesl = this.dataFilter.formatValue(row['1º Desl.']);
            
            // Get highlight classes
            const acaoClass = acao !== '-' && acao !== '' ? 
                (acao === 'Login Atrasado' ? 'login-atrasado' : 'highlight-action') : '';
            
            const primeiroLoginClass = this.dataFilter.getHighlightClass(row['1º Login'], 'cond4');
            const primeiroDespClass = this.dataFilter.getHighlightClass(row['1º Desp'], 'cond2');
            const primeiroDeslClass = this.dataFilter.getHighlightClass(row['1º Desl.'], 'cond3');
            
            return `
                <tr data-equipe="${row['Equipe']}">
                    <td><strong>${row['Equipe'] || ''}</strong></td>
                    <td class="${row['Login'] === '(Empty)' ? 'empty-cell' : ''}">
                        ${row['Login'] || ''}
                    </td>
                    <td>${row['Inicio Calendário'] || ''}</td>
                    <td>
                        ${acaoClass ? `<span class="${acaoClass}">${acao}</span>` : acao}
                    </td>
                    <td class="${row['Status Desloc'] === '(Empty)' ? 'empty-cell' : ''}">
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
        
        // Add row click handlers
        this.addTableRowHandlers();
    }
    
    updateCards(data) {
        const container = document.getElementById('cardsContainer');
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-database fa-3x" style="color: #95a5a6; margin-bottom: 1rem;"></i>
                    <p>Nenhum dado encontrado com os filtros atuais</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.map(row => {
            const conditions = this.dataFilter.getRowConditions(row);
            const conditionLabels = conditions.map(c => 
                `<span class="condition-tag" style="background-color: ${c.color}20; color: ${c.color};">
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
                    
                    <div class="team-conditions" style="margin-top: 1rem;">
                        ${conditionLabels}
                    </div>
                </div>
            `;
        }).join('');
    }
    
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
        
        // Calculate statistics
        const activeFilters = Object.values(filters).filter(Boolean).length;
        const filterPercentage = rawData.length > 0 ? 
            ((filteredData.length / rawData.length) * 100).toFixed(1) : 0;
        
        // Count by condition
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
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-number">${filteredData.length}</div>
                    <div class="stat-label">Equipes Filtradas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${filterPercentage}%</div>
                    <div class="stat-label">Percentual</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${activeFilters}/4</div>
                    <div class="stat-label">Filtros Ativos</div>
                </div>
            </div>
            
            <div class="condition-breakdown">
                <h4 style="margin: 1rem 0 0.5rem; color: #2c3e50;">Distribuição por Condição:</h4>
                <div class="breakdown-list">
                    ${Object.entries(conditionCounts).map(([id, count]) => `
                        <div class="breakdown-item">
                            <span class="breakdown-color" style="background-color: ${this.dataFilter.conditions[id].color}"></span>
                            <span class="breakdown-name">${this.dataFilter.conditions[id].name}:</span>
                            <span class="breakdown-count">${count} equipes</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
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
    
    addTableRowHandlers() {
        const rows = document.querySelectorAll('#tableBody tr');
        
        rows.forEach(row => {
            row.addEventListener('click', () => {
                // Remove highlight from all rows
                rows.forEach(r => r.style.backgroundColor = '');
                
                // Highlight clicked row
                row.style.backgroundColor = '#f0f7ff';
            });
        });
    }
    
    resetUI() {
        // Clear table
        document.getElementById('tableBody').innerHTML = '';
        
        // Clear cards
        document.getElementById('cardsContainer').innerHTML = '';
        
        // Clear file info
        document.getElementById('fileInfo').classList.remove('active');
        document.getElementById('fileInfo').innerHTML = '';
        
        // Clear summary
        document.getElementById('summaryContent').innerHTML = 
            '<p>Carregue um arquivo CSV para começar a análise.</p>';
        
        // Reset to table view
        this.currentView = 'table';
        document.getElementById('tableView').style.display = 'block';
        document.getElementById('cardsView').style.display = 'none';
        document.getElementById('toggleViewBtn').innerHTML = 
            '<i class="fas fa-th-large"></i> Alternar Visualização';
    }
}
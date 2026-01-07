// Métodos adicionais para UIManager

showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('dataMessage');
    messageDiv.innerHTML = `
        <div class="message-content ${type}">
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
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
        loading: 'spinner fa-spin',
        error: 'exclamation-triangle',
        success: 'check-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

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

showError(detailedMessage) {
    const modal = document.getElementById('errorModal');
    document.getElementById('errorMessage').innerHTML = detailedMessage;
    modal.classList.add('active');
}

hideModal() {
    document.getElementById('errorModal').classList.remove('active');
}
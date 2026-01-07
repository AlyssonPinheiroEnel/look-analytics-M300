// CSV Loader module - Carrega CSV automaticamente da pasta data/
export class CSVLoader {
    constructor() {
        this.csvUrl = 'data/dados.csv'; // Caminho padrão do CSV
        this.cacheBuster = `?v=${Date.now()}`; // Evita cache
        this.lastModified = null;
        this.checkInterval = 300000; // 5 minutos entre verificações
        this.data = [];
        this.metadata = {
            fileName: 'dados.csv',
            lastLoaded: null,
            rowCount: 0,
            fileSize: 0
        };
    }

    // Carrega o arquivo CSV automaticamente
    async loadCSV() {
        try {
            const url = this.csvUrl + this.cacheBuster;
            
            // Verifica se o arquivo existe
            const response = await fetch(url, { method: 'HEAD' });
            
            if (!response.ok) {
                throw new Error(`Arquivo CSV não encontrado em: ${this.csvUrl}`);
            }

            // Obtém a data da última modificação
            const lastModified = response.headers.get('last-modified');
            
            // Se o arquivo não foi modificado desde a última carga, usa os dados em cache
            if (this.lastModified === lastModified && this.data.length > 0) {
                console.log('Arquivo CSV não modificado. Usando cache.');
                return this.data;
            }

            // Carrega o conteúdo do CSV
            const csvResponse = await fetch(url);
            const csvText = await csvResponse.text();
            
            if (!csvText || csvText.trim() === '') {
                throw new Error('Arquivo CSV está vazio');
            }

            // Atualiza metadados
            this.lastModified = lastModified;
            this.metadata.lastLoaded = new Date().toLocaleString('pt-BR');
            this.metadata.fileSize = csvResponse.headers.get('content-length') || csvText.length;
            
            // Faz o parsing do CSV
            this.data = this.parseCSV(csvText);
            this.metadata.rowCount = this.data.length;
            
            console.log(`CSV carregado com sucesso: ${this.data.length} linhas`);
            return this.data;
            
        } catch (error) {
            console.error('Erro ao carregar CSV:', error);
            throw error;
        }
    }

    // Parsing do CSV (assumindo separador de tabulação)
    parseCSV(csvText) {
        try {
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                throw new Error('Nenhuma linha de dados encontrada');
            }

            // Detecta o separador (tab ou vírgula)
            const firstLine = lines[0];
            const separator = firstLine.includes('\t') ? '\t' : ',';
            
            // Extrai cabeçalhos
            const headers = firstLine.split(separator).map(h => h.trim());
            
            // Verifica cabeçalhos obrigatórios
            const requiredHeaders = ['Equipe', 'Login', 'Inicio Calendário', 'Ação', 'Status Desloc', '1º Login', '1º Desp', '1º Desl.'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            
            if (missingHeaders.length > 0) {
                console.warn('Cabeçalhos ausentes no CSV:', missingHeaders);
            }

            // Processa as linhas de dados
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim() === '') continue;
                
                const values = this.splitCSVLine(line, separator);
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] ? values[index].trim() : '';
                });
                
                data.push(row);
            }
            
            return data;
            
        } catch (error) {
            throw new Error(`Erro no parsing do CSV: ${error.message}`);
        }
    }

    // Split de linha CSV considerando aspas
    splitCSVLine(line, separator) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"' && !inQuotes) {
                inQuotes = true;
            } else if (char === '"' && inQuotes && nextChar === '"') {
                current += '"';
                i++; // Pula o próximo caractere
            } else if (char === '"' && inQuotes) {
                inQuotes = false;
            } else if (char === separator && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // Verifica se há atualizações no CSV
    async checkForUpdates() {
        try {
            const response = await fetch(this.csvUrl, { method: 'HEAD' });
            const lastModified = response.headers.get('last-modified');
            
            if (lastModified !== this.lastModified) {
                console.log('Arquivo CSV atualizado detectado');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao verificar atualizações:', error);
            return false;
        }
    }

    // Define um caminho diferente para o CSV (caso queira múltiplos arquivos)
    setCSVPath(path) {
        this.csvUrl = path;
        this.cacheBuster = `?v=${Date.now()}`;
        this.lastModified = null;
    }

    // Obtém informações do arquivo
    getFileInfo() {
        return {
            ...this.metadata,
            lastModified: this.lastModified,
            url: this.csvUrl
        };
    }

    // Limpa o cache
    clearCache() {
        this.data = [];
        this.lastModified = null;
        this.cacheBuster = `?v=${Date.now()}`;
    }

    // Valida a estrutura dos dados
    validateData(data) {
        if (!data || !Array.isArray(data)) {
            return { valid: false, error: 'Dados inválidos ou não carregados' };
        }

        if (data.length === 0) {
            return { valid: false, error: 'Nenhum dado encontrado no CSV' };
        }

        const sampleRow = data[0];
        const requiredFields = ['Equipe'];
        
        const missingFields = requiredFields.filter(field => !(field in sampleRow));
        
        if (missingFields.length > 0) {
            return { 
                valid: false, 
                error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
            };
        }

        return { valid: true, count: data.length };
    }
}
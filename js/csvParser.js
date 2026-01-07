// CSV Parser module
export class CSVParser {
    constructor() {
        this.separator = '\t'; // Assuming tab-separated CSV
    }
    
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    parse(csvContent) {
        try {
            const lines = csvContent.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                throw new Error('Arquivo CSV vazio');
            }
            
            // Extract headers (first line)
            const headers = lines[0].split(this.separator).map(header => header.trim());
            
            // Parse data rows
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(this.separator);
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] ? values[index].trim() : '';
                });
                
                data.push(row);
            }
            
            return data;
            
        } catch (error) {
            throw new Error(`Erro ao fazer parsing do CSV: ${error.message}`);
        }
    }
    
    convertToCSV(data, headers) {
        const csvRows = [];
        
        // Add header row
        csvRows.push(headers.join(this.separator));
        
        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header] || '';
                // Escape quotes and wrap in quotes if contains separator
                value = String(value).replace(/"/g, '""');
                if (value.includes(this.separator) || value.includes('"') || value.includes('\n')) {
                    value = `"${value}"`;
                }
                return value;
            });
            csvRows.push(values.join(this.separator));
        });
        
        return csvRows.join('\n');
    }
    
    // Utility method to validate CSV structure
    validateCSVStructure(data) {
        const requiredFields = ['Equipe', 'Login', 'Inicio Calendário', 'Ação', 'Status Desloc', '1º Login', '1º Desp', '1º Desl.'];
        
        if (data.length === 0) return false;
        
        const firstRow = data[0];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length > 0) {
            console.warn('Campos ausentes no CSV:', missingFields);
            return false;
        }
        
        return true;
    }
}
// Data Filter module
export class DataFilter {
    constructor() {
        this.conditions = {
            cond1: {
                name: 'Ação diferente de "-"',
                description: 'Equipes com alguma ação registrada',
                check: (row) => {
                    const acao = row['Ação'] || '';
                    return acao !== '-' && acao !== '';
                },
                color: '#e74c3c'
            },
            cond2: {
                name: '1º Desp > 10',
                description: 'Tempo do primeiro despacho superior a 10 minutos',
                check: (row) => {
                    const value = row['1º Desp'] || '';
                    const num = this.parseNumber(value);
                    return !isNaN(num) && num > 10;
                },
                color: '#f39c12'
            },
            cond3: {
                name: '1º Desl > 25',
                description: 'Tempo do primeiro deslocamento superior a 25 minutos',
                check: (row) => {
                    const value = row['1º Desl.'] || '';
                    const num = this.parseNumber(value);
                    return !isNaN(num) && num > 25;
                },
                color: '#3498db'
            },
            cond4: {
                name: '1º Login > 5',
                description: 'Tempo do primeiro login superior a 5 minutos',
                check: (row) => {
                    const value = row['1º Login'] || '';
                    const num = this.parseNumber(value);
                    return !isNaN(num) && num > 5;
                },
                color: '#9b59b6'
            }
        };
    }
    
    parseNumber(value) {
        if (value === '(Empty)' || value === '' || value === null) {
            return NaN;
        }
        
        // Remove any non-numeric characters except decimal point and minus
        const cleaned = String(value).replace(/[^\d.-]/g, '');
        return parseFloat(cleaned);
    }
    
    applyFilters(data, activeFilters) {
        if (!data || data.length === 0) return [];
        
        // Filter data based on active conditions
        return data.filter(row => {
            // Check if row matches at least one active condition
            for (const [filterId, isActive] of Object.entries(activeFilters)) {
                if (isActive && this.conditions[filterId] && this.conditions[filterId].check(row)) {
                    return true;
                }
            }
            return false;
        });
    }
    
    getRowConditions(row) {
        const matchedConditions = [];
        
        for (const [filterId, condition] of Object.entries(this.conditions)) {
            if (condition.check(row)) {
                matchedConditions.push({
                    id: filterId,
                    name: condition.name,
                    color: condition.color
                });
            }
        }
        
        return matchedConditions;
    }
    
    getHighlightClass(value, conditionId) {
        const num = this.parseNumber(value);
        
        switch (conditionId) {
            case 'cond1':
                return 'highlight-action';
            case 'cond2':
                return !isNaN(num) && num > 10 ? 'highlight-desp' : '';
            case 'cond3':
                return !isNaN(num) && num > 25 ? 'highlight-desl' : '';
            case 'cond4':
                return !isNaN(num) && num > 5 ? 'highlight-login' : '';
            default:
                return '';
        }
    }
    
    formatValue(value) {
        if (value === '(Empty)' || value === '' || value === null) {
            return { text: '(Empty)', isEmpty: true };
        }
        
        const num = this.parseNumber(value);
        if (!isNaN(num)) {
            return { text: num.toString(), isEmpty: false };
        }
        
        return { text: value, isEmpty: false };
    }
}
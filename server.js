const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para listar arquivos CSV disponíveis
app.get('/api/files', (req, res) => {
    const dataDir = path.join(__dirname, 'data');
    
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        return res.json([]);
    }
    
    const files = fs.readdirSync(dataDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => ({
            name: file,
            size: fs.statSync(path.join(dataDir, file)).size,
            created: fs.statSync(path.join(dataDir, file)).birthtime
        }));
    
    res.json(files);
});

// Rota para ler um arquivo CSV específico
app.get('/api/file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'data', filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.json({ 
            filename, 
            content,
            size: fs.statSync(filePath).size
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao ler arquivo', details: error.message });
    }
});

// Rota para upload de arquivos CSV
app.post('/api/upload', express.raw({ type: 'text/csv', limit: '10mb' }), (req, res) => {
    try {
        const filename = req.query.filename || `upload_${Date.now()}.csv`;
        const filePath = path.join(__dirname, 'data', filename);
        
        // Salvar o arquivo
        fs.writeFileSync(filePath, req.body);
        
        res.json({
            success: true,
            filename,
            size: Buffer.byteLength(req.body),
            path: `/data/${filename}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar arquivo', details: error.message });
    }
});

// Rota de saúde do servidor
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: [
            '/api/files',
            '/api/file/:filename',
            '/api/upload',
            '/api/health'
        ]
    });
});

// Rota para exportar dados filtrados
app.post('/api/export', (req, res) => {
    try {
        const { data, filename = `export_${Date.now()}.csv` } = req.body;
        
        if (!data) {
            return res.status(400).json({ error: 'Dados não fornecidos' });
        }
        
        const exportPath = path.join(__dirname, 'data', filename);
        fs.writeFileSync(exportPath, data);
        
        res.json({
            success: true,
            filename,
            downloadUrl: `/api/download/${filename}`,
            message: 'Arquivo exportado com sucesso'
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao exportar arquivo', details: error.message });
    }
});

// Rota para download de arquivos
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'data', filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Arquivo não encontrado');
    }
    
    res.download(filePath, filename);
});

// Rota para processamento de dados (opcional)
app.post('/api/process', (req, res) => {
    const { data, filters } = req.body;
    
    try {
        // Aqui você pode adicionar lógica de processamento no servidor
        const processedData = data.filter(row => {
            // Lógica de filtragem básica (pode ser expandida)
            const conditions = [];
            
            if (filters.cond1) {
                conditions.push(row['Ação'] && row['Ação'] !== '-' && row['Ação'] !== '');
            }
            
            if (filters.cond2) {
                const desp = parseFloat(row['1º Desp'] || 0);
                conditions.push(!isNaN(desp) && desp > 10);
            }
            
            if (filters.cond3) {
                const desl = parseFloat(row['1º Desl.'] || 0);
                conditions.push(!isNaN(desl) && desl > 25);
            }
            
            if (filters.cond4) {
                const login = parseFloat(row['1º Login'] || 0);
                conditions.push(!isNaN(login) && login > 5);
            }
            
            return conditions.some(cond => cond === true);
        });
        
        res.json({
            success: true,
            originalCount: data.length,
            filteredCount: processedData.length,
            filteredPercentage: ((processedData.length / data.length) * 100).toFixed(1),
            data: processedData
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro no processamento', 
            details: error.message 
        });
    }
});

// Middleware para tratamento de erros 404
app.use((req, res, next) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware para tratamento de erros gerais
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor', 
        message: err.message 
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════╗
    ║        SERVIDOR PRODUTIVIDADE FILTER             ║
    ╠══════════════════════════════════════════════════╣
    ║  ✅ Servidor rodando em: http://localhost:${PORT}  ║
    ║  📁 Acesso local: http://127.0.0.1:${PORT}        ║
    ║  📂 Pasta de dados: ${path.join(__dirname, 'data')} ║
    ╚══════════════════════════════════════════════════╝
    
    Endpoints disponíveis:
    • GET  /                   → Interface web
    • GET  /api/files         → Lista arquivos CSV
    • GET  /api/file/:name    → Lê arquivo específico
    • POST /api/upload        → Upload de CSV
    • POST /api/process       → Processa dados
    • GET  /api/health        → Status do servidor
    
    Pressione Ctrl+C para parar o servidor.
    `);
});
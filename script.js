let dadosOriginais = [];
let filtroAtual = 'todos';

// Configurações das colunas
const COLUNAS = {
    EQUIPE: 'Equipe',
    INICIO: 'Inicio Calendário',
    LOGIN: 'Login',
    ACAO: 'Ação',
    STATUS: 'Status Desloc',
    LOGIN1: '1º Login',
    DESP1: '1º Desp',
    DESL1: '1º Desl.'
};

// Detecta separador do CSV
function detectarSeparador(linha) {
    const tabs = (linha.match(/\t/g) || []).length;
    const virgulas = (linha.match(/,/g) || []).length;
    const pontoVirgula = (linha.match(/;/g) || []).length;
    
    if (tabs > virgulas && tabs > pontoVirgula) return '\t';
    if (pontoVirgula > virgulas) return ';';
    return ',';
}

// Processa arquivo CSV
function processarCSV(texto) {
    const linhas = texto.split('\n').filter(l => l.trim() !== '');
    if (linhas.length < 2) throw new Error('Arquivo vazio ou inválido');
    
    // Detecta separador
    const separador = detectarSeparador(linhas[0]);
    console.log(`Separador detectado: ${separador === '\t' ? 'TAB' : separador}`);
    
    // Processa cabeçalhos
    const cabecalhos = linhas[0].split(separador).map(h => h.trim().replace(/"/g, ''));
    console.log('Cabeçalhos:', cabecalhos);
    
    // Encontra índices das colunas
    const indices = {};
    Object.keys(COLUNAS).forEach(chave => {
        const nome = COLUNAS[chave];
        const idx = cabecalhos.findIndex(h => 
            h.toLowerCase() === nome.toLowerCase() ||
            h.toLowerCase().replace('º', '°') === nome.toLowerCase().replace('º', '°') ||
            h.toLowerCase().replace('desl.', 'desl') === nome.toLowerCase().replace('desl.', 'desl')
        );
        indices[chave] = idx !== -1 ? idx : null;
        if (idx !== -1) console.log(`Coluna "${nome}" encontrada no índice ${idx}`);
    });
    
    // Processa dados
    const dados = [];
    for (let i = 1; i < linhas.length; i++) {
        const celulas = linhas[i].split(separador).map(c => {
            let valor = c.trim();
            if (valor.startsWith('"') && valor.endsWith('"')) {
                valor = valor.slice(1, -1);
            }
            return valor;
        });
        
        const linha = {};
        Object.keys(indices).forEach(chave => {
            const idx = indices[chave];
            linha[COLUNAS[chave]] = idx !== null && idx < celulas.length ? celulas[idx] : '';
        });
        
        if (linha[COLUNAS.EQUIPE] && linha[COLUNAS.EQUIPE].trim()) {
            dados.push(linha);
        }
    }
    
    console.log(`${dados.length} linhas processadas`);
    return dados;
}

// Verifica condições
function verificarCondicoes(linha) {
    const parseNum = (valor) => {
        if (!valor || valor === '(Empty)' || valor === '-' || valor === '' || valor === '(empty)') return null;
        const num = parseFloat(valor.toString().replace(',', '.'));
        return isNaN(num) ? null : num;
    };
    
    const cond1 = linha[COLUNAS.ACAO] && 
                  linha[COLUNAS.ACAO].trim() !== '-' && 
                  linha[COLUNAS.ACAO].trim() !== '' && 
                  linha[COLUNAS.ACAO].trim() !== '(Empty)' &&
                  linha[COLUNAS.ACAO].trim() !== '(empty)';
    
    const desp1 = parseNum(linha[COLUNAS.DESP1]);
    const desl1 = parseNum(linha[COLUNAS.DESL1]);
    const login1 = parseNum(linha[COLUNAS.LOGIN1]);
    
    const cond2 = desp1 !== null && desp1 > 10;
    const cond3 = desl1 !== null && desl1 > 25;
    const cond4 = login1 !== null && login1 > 5;
    
    return {
        cond1, cond2, cond3, cond4,
        temQualquer: cond1 || cond2 || cond3 || cond4
    };
}

// Formata valor para exibição
function formatarValor(valor) {
    if (!valor || valor === '(Empty)' || valor === '-' || valor === '(empty)') return '-';
    return valor;
}

// Aplica cor à célula baseada na condição
function aplicarCorCelula(valor, condicao, tipoCondicao) {
    if (!condicao) return valor;
    
    const cores = {
        cond1: 'rgba(247, 37, 133, 0.15)',
        cond2: 'rgba(248, 150, 30, 0.15)',
        cond3: 'rgba(67, 97, 238, 0.15)',
        cond4: 'rgba(114, 9, 183, 0.15)'
    };
    
    const textColors = {
        cond1: '#f72585',
        cond2: '#f8961e',
        cond3: '#4361ee',
        cond4: '#7209b7'
    };
    
    return `<span style="
        background: ${cores[tipoCondicao]};
        color: ${textColors[tipoCondicao]};
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
    ">${valor}</span>`;
}

// Atualiza tabela
function atualizarTabela() {
    const tbody = document.getElementById('dados');
    const exportBtn = document.getElementById('exportBtn');
    
    // Filtra dados conforme filtro atual
    let dadosExibir = [];
    let contadores = { cond1: 0, cond2: 0, cond3: 0, cond4: 0 };
    
    dadosOriginais.forEach(linha => {
        const cond = verificarCondicoes(linha);
        
        // Conta condições
        if (cond.cond1) contadores.cond1++;
        if (cond.cond2) contadores.cond2++;
        if (cond.cond3) contadores.cond3++;
        if (cond.cond4) contadores.cond4++;
        
        // Verifica se deve exibir
        let exibir = false;
        switch(filtroAtual) {
            case 'todos': exibir = cond.temQualquer; break;
            case 'cond1': exibir = cond.cond1; break;
            case 'cond2': exibir = cond.cond2; break;
            case 'cond3': exibir = cond.cond3; break;
            case 'cond4': exibir = cond.cond4; break;
        }
        
        if (exibir) dadosExibir.push({ linha, cond });
    });
    
    // Atualiza resumo
    document.getElementById('total').textContent = dadosOriginais.length;
    document.getElementById('cond1').textContent = contadores.cond1;
    document.getElementById('cond2').textContent = contadores.cond2;
    document.getElementById('cond3').textContent = contadores.cond3;
    document.getElementById('cond4').textContent = contadores.cond4;
    
    // Atualiza contador da tabela
    document.getElementById('tableCount').textContent = 
        `Mostrando ${dadosExibir.length} de ${dadosOriginais.length} equipes`;
    
    // Habilita/desabilita botão de exportação
    exportBtn.disabled = dadosExibir.length === 0;
    
    // Renderiza tabela
    if (dadosExibir.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h3 class="empty-title">Nenhuma equipe encontrada</h3>
                        <p class="empty-text">
                            Nenhuma equipe atende ao filtro selecionado. Tente outro filtro ou verifique os dados.
                        </p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    dadosExibir.forEach((item, index) => {
        const l = item.linha;
        const c = item.cond;
        
        let classe = '';
        if (c.cond1) classe += 'cond1 ';
        if (c.cond2) classe += 'cond2 ';
        if (c.cond3) classe += 'cond3 ';
        if (c.cond4) classe += 'cond4 ';
        
        html += `<tr class="${classe.trim()}">`;
        html += `<td><strong>${formatarValor(l[COLUNAS.EQUIPE])}</strong></td>`;
        html += `<td>${formatarValor(l[COLUNAS.INICIO])}</td>`;
        html += `<td>${formatarValor(l[COLUNAS.LOGIN])}</td>`;
        html += `<td>${c.cond1 ? aplicarCorCelula(formatarValor(l[COLUNAS.ACAO]), c.cond1, 'cond1') : formatarValor(l[COLUNAS.ACAO])}</td>`;
        html += `<td>${formatarValor(l[COLUNAS.STATUS])}</td>`;
        html += `<td>${c.cond4 ? aplicarCorCelula(formatarValor(l[COLUNAS.LOGIN1]), c.cond4, 'cond4') : formatarValor(l[COLUNAS.LOGIN1])}</td>`;
        html += `<td>${c.cond2 ? aplicarCorCelula(formatarValor(l[COLUNAS.DESP1]), c.cond2, 'cond2') : formatarValor(l[COLUNAS.DESP1])}</td>`;
        html += `<td>${c.cond3 ? aplicarCorCelula(formatarValor(l[COLUNAS.DESL1]), c.cond3, 'cond3') : formatarValor(l[COLUNAS.DESL1])}</td>`;
        html += `</tr>`;
    });
    
    tbody.innerHTML = html;
}

// Aplica filtro
function filtrar(tipo) {
    filtroAtual = tipo;
    
    // Atualiza botões ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Atualiza tabela
    atualizarTabela();
    
    // Animação suave
    const tabela = document.querySelector('.table-section');
    tabela.style.animation = 'none';
    setTimeout(() => {
        tabela.style.animation = 'fadeIn 0.5s ease';
    }, 10);
}

// Exporta tabela para PNG com legenda
async function exportarParaPNG() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const tableSection = document.getElementById('tableSection');
    
    try {
        // Mostra loading
        loadingOverlay.style.display = 'flex';
        
        // Cria um container para a imagem
        const exportContainer = document.createElement('div');
        exportContainer.style.cssText = `
            position: fixed;
            top: -10000px;
            left: -10000px;
            width: 1200px;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        `;
        
        // Adiciona título
        const title = document.createElement('h1');
        title.textContent = 'Dashboard de Equipes - Relatório Filtrado';
        title.style.cssText = `
            text-align: center;
            color: #4361ee;
            margin-bottom: 20px;
            font-size: 24px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        `;
        exportContainer.appendChild(title);
        
        // Adiciona data e hora
        const now = new Date();
        const dateTime = document.createElement('div');
        dateTime.textContent = `Gerado em: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
        dateTime.style.cssText = `
            text-align: center;
            color: #666;
            margin-bottom: 25px;
            font-size: 14px;
        `;
        exportContainer.appendChild(dateTime);
        
        // Adiciona resumo
        const summaryDiv = document.createElement('div');
        summaryDiv.style.cssText = `
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        `;
        
        const stats = [
            { label: 'Total Equipes', value: document.getElementById('total').textContent, color: '#212529' },
            { label: 'Ação ≠ "-"', value: document.getElementById('cond1').textContent, color: '#f72585' },
            { label: '1º Desp > 10', value: document.getElementById('cond2').textContent, color: '#f8961e' },
            { label: '1º Desl > 25', value: document.getElementById('cond3').textContent, color: '#4361ee' },
            { label: '1º Login > 5', value: document.getElementById('cond4').textContent, color: '#7209b7' }
        ];
        
        stats.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.style.cssText = `
                text-align: center;
                padding: 15px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-left: 4px solid ${stat.color};
            `;
            
            const label = document.createElement('div');
            label.textContent = stat.label;
            label.style.cssText = `
                font-size: 12px;
                color: #666;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            
            const value = document.createElement('div');
            value.textContent = stat.value;
            value.style.cssText = `
                font-size: 24px;
                font-weight: bold;
                color: #212529;
            `;
            
            statDiv.appendChild(label);
            statDiv.appendChild(value);
            summaryDiv.appendChild(statDiv);
        });
        
        exportContainer.appendChild(summaryDiv);
        
        // Adiciona filtro atual
        const filterDiv = document.createElement('div');
        filterDiv.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background: #e9ecef;
            border-radius: 8px;
            font-size: 14px;
        `;
        
        const filterLabels = {
            'todos': 'Todas as Condições',
            'cond1': 'Ação ≠ "-"',
            'cond2': '1º Desp > 10',
            'cond3': '1º Desl > 25',
            'cond4': '1º Login > 5'
        };
        
        filterDiv.textContent = `Filtro aplicado: ${filterLabels[filtroAtual]} | Mostrando ${document.getElementById('tableCount').textContent}`;
        exportContainer.appendChild(filterDiv);
        
        // Adiciona legenda das cores
        const legendDiv = document.createElement('div');
        legendDiv.style.cssText = `
            margin-bottom: 25px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        `;
        
        const legendTitle = document.createElement('div');
        legendTitle.textContent = 'Legenda dos Indicadores:';
        legendTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 15px;
            color: #212529;
            font-size: 16px;
        `;
        legendDiv.appendChild(legendTitle);
        
        const legendItems = [
            { color: '#f72585', label: 'Ação preenchida (diferente de "-")' },
            { color: '#f8961e', label: '1º Desp > 10 (tempo alto de despacho)' },
            { color: '#4361ee', label: '1º Desl > 25 (deslocamento longo)' },
            { color: '#7209b7', label: '1º Login > 5 (login atrasado)' }
        ];
        
        legendItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
                padding: 8px 12px;
                background: white;
                border-radius: 4px;
            `;
            
            const colorBox = document.createElement('div');
            colorBox.style.cssText = `
                width: 20px;
                height: 20px;
                border-radius: 4px;
                background: ${item.color};
            `;
            
            const labelSpan = document.createElement('span');
            labelSpan.textContent = item.label;
            labelSpan.style.cssText = `
                font-size: 14px;
                color: #495057;
            `;
            
            itemDiv.appendChild(colorBox);
            itemDiv.appendChild(labelSpan);
            legendDiv.appendChild(itemDiv);
        });
        
        exportContainer.appendChild(legendDiv);
        
        // Adiciona a tabela original (clonada)
        const tableClone = document.getElementById('tableContainer').cloneNode(true);
        tableClone.style.width = '100%';
        tableClone.style.overflow = 'visible';
        
        // Remove elementos interativos e ajusta estilos
        const table = tableClone.querySelector('table');
        table.style.width = '100%';
        table.style.minWidth = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '12px';
        
        // Ajusta estilos das células
        const ths = table.querySelectorAll('th');
        ths.forEach(th => {
            th.style.padding = '12px 15px';
            th.style.background = '#343a40';
            th.style.color = 'white';
            th.style.fontWeight = 'bold';
            th.style.border = '1px solid #dee2e6';
        });
        
        const tds = table.querySelectorAll('td');
        tds.forEach(td => {
            td.style.padding = '10px 15px';
            td.style.border = '1px solid #dee2e6';
        });
        
        exportContainer.appendChild(tableClone);
        
        // Adiciona footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #666;
            font-size: 12px;
        `;
        footer.textContent = 'Dashboard de Equipes © 2024 | Gerado automaticamente';
        exportContainer.appendChild(footer);
        
        // Adiciona ao documento
        document.body.appendChild(exportContainer);
        
        // Usa html2canvas para converter em imagem
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            onclone: (clonedDoc) => {
                // Ajusta estilos no clone
                const clonedContainer = clonedDoc.querySelector('div');
                clonedContainer.style.position = 'relative';
                clonedContainer.style.top = '0';
                clonedContainer.style.left = '0';
            }
        });
        
        // Converte canvas para imagem PNG
        const imgData = canvas.toDataURL('image/png');
        
        // Cria link para download
        const link = document.createElement('a');
        const fileName = `equipes_filtradas_${filtroAtual}_${Date.now()}.png`;
        link.href = imgData;
        link.download = fileName;
        
        // Adiciona tooltip de confirmação
        mostrarNotificacao('Imagem PNG gerada com sucesso! Download iniciado...', 'success');
        
        // Força o download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Remove o container de exportação
        document.body.removeChild(exportContainer);
        
    } catch (error) {
        console.error('Erro ao exportar PNG:', error);
        mostrarNotificacao('Erro ao gerar imagem PNG: ' + error.message, 'error');
    } finally {
        // Esconde loading
        loadingOverlay.style.display = 'none';
    }
}

// Mostra notificação
function mostrarNotificacao(mensagem, tipo) {
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease;
        background: ${tipo === 'success' ? 'linear-gradient(135deg, #4cc9f0, #4895ef)' : 'linear-gradient(135deg, #f72585, #e63946)'};
    `;
    notificacao.textContent = mensagem;
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// Troca arquivo
function trocarArquivo() {
    location.reload();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const texto = e.target.result;
                dadosOriginais = processarCSV(texto);
                
                // Atualiza interface
                uploadArea.innerHTML = `
                    <div class="upload-icon" style="color: #4cc9f0">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2 class="upload-title">Arquivo Carregado com Sucesso!</h2>
                    <p class="upload-text">
                        <strong>${dadosOriginais.length} equipes</strong> processadas do arquivo 
                        <strong>${file.name}</strong>
                    </p>
                    <div class="upload-actions">
                        <button class="btn btn-outline" onclick="trocarArquivo()">
                            <i class="fas fa-redo"></i> Carregar Outro Arquivo
                        </button>
                    </div>
                `;
                
                // Animação
                uploadArea.style.transform = 'scale(1.02)';
                uploadArea.style.boxShadow = '0 15px 35px rgba(67, 97, 238, 0.2)';
                setTimeout(() => {
                    uploadArea.style.transform = 'scale(1)';
                    uploadArea.style.boxShadow = 'var(--box-shadow)';
                }, 300);
                
                atualizarTabela();
                mostrarNotificacao(`Arquivo "${file.name}" carregado com sucesso!`, 'success');
                
            } catch (erro) {
                mostrarNotificacao('Erro ao processar arquivo: ' + erro.message, 'error');
                console.error(erro);
            }
        };
        
        reader.readAsText(file, 'UTF-8');
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#4cc9f0';
        uploadArea.style.background = 'linear-gradient(135deg, rgba(76, 201, 240, 0.1), rgba(72, 149, 239, 0.1))';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--light-gray)';
        uploadArea.style.background = 'white';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--light-gray)';
        uploadArea.style.background = 'white';
        
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        } else {
            mostrarNotificacao('Por favor, selecione um arquivo CSV válido.', 'error');
        }
    });
    
    // Animação inicial
    setTimeout(() => {
        document.querySelectorAll('section').forEach((section, index) => {
            section.style.animationDelay = `${index * 0.2}s`;
        });
    }, 100);
});
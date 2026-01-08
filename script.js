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

// Carrega dados de exemplo
function carregarExemplo() {
    const exemploCSV = `Base	Tipo Equipe	Período	Equipe	Jornada	Refeição	Inicio Calendário	Login	GPS	Organizacao	Base DAP	Status Desloc	Tempo Etapa	Disp. Eorder	Ação	Incidência	Placa	Qtd Desloc	Util.	1º Login	1º Desp	1º Desl.	Fim calendário	LogOff	Ext Calendário	Realizou HE	Em Trabalho	Turno Equipe
NORTE	EMERGENCIA	Manhã	ITE-RD-02B	12 - 4	TriangleUp,ffb43c3c	06:00	05:45	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	Em Deslocamento	25	Circle,ff50af28	-	0039938031	RJO3A72	5	27%	0	16	64	14:20	(Empty)	Não	Não	Sim	Manhã / 06
NORTE	EMERGENCIA	Manhã	ITE-RD-01B	12 - 4	Circle,ffc9c9c9	07:00	06:10	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	Em Deslocamento	36	Circle,ff50af28	-	0039937919	BDU8C96	3	57%	0	23	27	15:20	(Empty)	Não	Não	Sim	Manhã / 07
NORTE	EMERGENCIA	Manhã	ITE-RD-03B	12 - 3	Circle,ffc9c9c9	07:00	06:55	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	No Local	42	Circle,ff50af28	-	0039937723	RJP3B07	3	53%	0	18	20	15:30	(Empty)	Não	Não	Sim	Manhã / 07
NORTE	EMERGENCIA	Manhã	ACU-TR-02B	12 - 2	Circle,ffc9c9c9	08:00	07:41	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	No Local	66	Circle,ff50af28	Reparo >60	0039936013	SSZ0H63	2	48%	0	0	1	17:48	(Empty)	Não	Não	Sim	Manhã / 08
NORTE	EMERGENCIA	Manhã	ACU-TR-03B	12 - 2	Circle,ffc9c9c9	09:00	07:56	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	No Local	6	Circle,ff50af28	-	0039937581	TLV1H86	2	58%	0	0	0	18:48	(Empty)	Não	Não	Sim	Manhã / 08
NORTE	EMERGENCIA	Manhã	IPK-RD-11B	12 - 4	TriangleUp,ffb43c3c	06:00	05:34	Cross,ffffab9e	AUTOMATICO	ATLÂNTICO	No Local	63	Circle,ff50af28	Reparo >60	0039937043	SBC9B13	2	63%	0	11	19	14:20	(Empty)	Não	Não	Sim	Manhã / 06
NORTE	EMERGENCIA	Manhã	ITJ-SP-01B	12 - 2	Circle,ffc9c9c9	08:00	07:53	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	Em Deslocamento	12	Circle,ff50af28	-	0039937763	SWX6D34	2	81%	0	9	12	17:48	(Empty)	Não	Não	Sim	Manhã / 08
NORTE	EMERGENCIA	Manhã	TRR-SG-01B	12 - 3	Circle,ffc9c9c9	08:00	06:47	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	No Local	36	Circle,ff50af28	-	0039935565	TCW4B49	2	70%	0	0	0	17:15	(Empty)	Não	Não	Sim	Manhã / 08`;
    
    try {
        dadosOriginais = processarCSV(exemploCSV);
        
        // Atualiza interface
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div class="upload-icon" style="color: #4cc9f0">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 class="upload-title">Dados de Exemplo Carregados!</h2>
            <p class="upload-text">
                <strong>${dadosOriginais.length} equipes</strong> carregadas com sucesso. 
                Use os filtros abaixo para analisar os dados.
            </p>
            <div class="upload-actions">
                <button class="btn btn-outline" onclick="trocarArquivo()">
                    <i class="fas fa-redo"></i> Carregar Outro Arquivo
                </button>
            </div>
        `;
        
        // Animação de confirmação
        uploadArea.style.transform = 'scale(1.02)';
        uploadArea.style.boxShadow = '0 15px 35px rgba(67, 97, 238, 0.2)';
        setTimeout(() => {
            uploadArea.style.transform = 'scale(1)';
            uploadArea.style.boxShadow = 'var(--box-shadow)';
        }, 300);
        
        atualizarTabela();
        
        // Notificação visual
        mostrarNotificacao('Dados de exemplo carregados com sucesso!', 'success');
        
    } catch (erro) {
        mostrarNotificacao('Erro ao carregar exemplo: ' + erro.message, 'error');
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
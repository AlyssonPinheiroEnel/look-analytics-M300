let dadosOriginais = [];
let dadosFiltrados = [];
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
    if (linhas.length < 2) throw new Error('Arquivo vazio');
    
    // Detecta separador
    const separador = detectarSeparador(linhas[0]);
    
    // Processa cabeçalhos
    const cabecalhos = linhas[0].split(separador).map(h => h.trim().replace(/"/g, ''));
    
    // Encontra índices das colunas que precisamos
    const indices = {};
    Object.keys(COLUNAS).forEach(chave => {
        const nome = COLUNAS[chave];
        const idx = cabecalhos.findIndex(h => 
            h.toLowerCase() === nome.toLowerCase() ||
            h.toLowerCase().replace('º', '°') === nome.toLowerCase().replace('º', '°')
        );
        indices[chave] = idx !== -1 ? idx : null;
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
    
    return dados;
}

// Verifica condições
function verificarCondicoes(linha) {
    const parseNum = (valor) => {
        if (!valor || valor === '(Empty)' || valor === '-' || valor === '') return null;
        const num = parseFloat(valor.toString().replace(',', '.'));
        return isNaN(num) ? null : num;
    };
    
    const cond1 = linha[COLUNAS.ACAO] && 
                  linha[COLUNAS.ACAO].trim() !== '-' && 
                  linha[COLUNAS.ACAO].trim() !== '' && 
                  linha[COLUNAS.ACAO].trim() !== '(Empty)';
    
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
    
    // Renderiza tabela
    if (dadosExibir.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="mensagem">
                    <i class="fas fa-search" style="font-size: 48px; color: #ddd;"></i>
                    <p>Nenhuma equipe encontrada com o filtro atual</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    dadosExibir.forEach(item => {
        const l = item.linha;
        const c = item.cond;
        
        let classe = '';
        if (c.cond1) classe += 'vermelho ';
        if (c.cond2) classe += 'laranja ';
        if (c.cond3) classe += 'azul ';
        if (c.cond4) classe += 'lilas ';
        
        html += `<tr class="${classe.trim()}">`;
        html += `<td>${formatarValor(l[COLUNAS.EQUIPE])}</td>`;
        html += `<td>${formatarValor(l[COLUNAS.INICIO])}</td>`;
        html += `<td>${formatarValor(l[COLUNAS.LOGIN])}</td>`;
        html += `<td style="${c.cond1 ? 'background-color: rgba(220, 53, 69, 0.3); font-weight: bold;' : ''}">${formatarValor(l[COLUNAS.ACAO])}</td>`;
        html += `<td>${formatarValor(l[COLUNAS.STATUS])}</td>`;
        html += `<td style="${c.cond4 ? 'background-color: rgba(111, 66, 193, 0.3); font-weight: bold;' : ''}">${formatarValor(l[COLUNAS.LOGIN1])}</td>`;
        html += `<td style="${c.cond2 ? 'background-color: rgba(253, 126, 20, 0.3); font-weight: bold;' : ''}">${formatarValor(l[COLUNAS.DESP1])}</td>`;
        html += `<td style="${c.cond3 ? 'background-color: rgba(0, 123, 255, 0.3); font-weight: bold;' : ''}">${formatarValor(l[COLUNAS.DESL1])}</td>`;
        html += `</tr>`;
    });
    
    tbody.innerHTML = html;
}

// Formata valor para exibição
function formatarValor(valor) {
    if (!valor || valor === '(Empty)' || valor === '-') return '';
    return valor;
}

// Aplica filtro
function filtrar(tipo) {
    filtroAtual = tipo;
    
    // Atualiza botões ativos
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('ativo');
    });
    
    event.target.classList.add('ativo');
    
    // Atualiza tabela
    atualizarTabela();
}

// Carrega dados de exemplo
function carregarExemplo() {
    const exemploCSV = `Base	Tipo Equipe	Período	Equipe	Jornada	Refeição	Inicio Calendário	Login	GPS	Organizacao	Base DAP	Status Desloc	Tempo Etapa	Disp. Eorder	Ação	Incidência	Placa	Qtd Desloc	Util.	1º Login	1º Desp	1º Desl.	Fim calendário	LogOff	Ext Calendário	Realizou HE	Em Trabalho	Turno Equipe
NORTE	EMERGENCIA	Manhã	ITE-RD-02B	12 - 4	TriangleUp,ffb43c3c	06:00	05:45	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	Em Deslocamento	25	Circle,ff50af28	-	0039938031	RJO3A72	5	27%	0	16	64	14:20	(Empty)	Não	Não	Sim	Manhã / 06
NORTE	EMERGENCIA	Manhã	ITE-RD-01B	12 - 4	Circle,ffc9c9c9	07:00	06:10	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	Em Deslocamento	36	Circle,ff50af28	-	0039937919	BDU8C96	3	57%	0	23	27	15:20	(Empty)	Não	Não	Sim	Manhã / 07
NORTE	EMERGENCIA	Manhã	ITE-RD-03B	12 - 3	Circle,ffc9c9c9	07:00	06:55	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	No Local	42	Circle,ff50af28	-	0039937723	RJP3B07	3	53%	0	18	20	15:30	(Empty)	Não	Não	Sim	Manhã / 07
NORTE	EMERGENCIA	Manhã	ACU-TR-02B	12 - 2	Circle,ffc9c9c9	08:00	07:41	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	No Local	66	Circle,ff50af28	Reparo >60	0039936013	SSZ0H63	2	48%	0	0	1	17:48	(Empty)	Não	Não	Sim	Manhã / 08
NORTE	EMERGENCIA	Manhã	ACU-TR-03B	12 - 2	Circle,ffc9c9c9	09:00	07:56	Circle,ff37db7e	AUTOMATICO	ATLÂNTICO	No Local	6	Circle,ff50af28	-	0039937581	TLV1H86	2	58%	0	0	0	18:48	(Empty)	Não	Não	Sim	Manhã / 08
NORTE	EMERGENCIA	Manhã	IPK-RD-11B	12 - 4	TriangleUp,ffb43c3c	06:00	05:34	Cross,ffffab9e	AUTOMATICO	ATLÂNTICO	No Local	63	Circle,ff50af28	Reparo >60	0039937043	SBC9B13	2	63%	0	11	19	14:20	(Empty)	Não	Não	Sim	Manhã / 06`;
    
    try {
        dadosOriginais = processarCSV(exemploCSV);
        alert(`Dados de exemplo carregados!\nTotal de equipes: ${dadosOriginais.length}`);
        atualizarTabela();
    } catch (erro) {
        alert('Erro ao carregar exemplo: ' + erro.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const texto = e.target.result;
                dadosOriginais = processarCSV(texto);
                
                alert(`Arquivo "${file.name}" carregado com sucesso!\nEquipes encontradas: ${dadosOriginais.length}`);
                
                // Atualiza interface
                document.querySelector('.upload-area').innerHTML = `
                    <i class="fas fa-check-circle" style="color: #28a745"></i>
                    <h3>Arquivo carregado!</h3>
                    <p>${file.name}</p>
                    <p><strong>${dadosOriginais.length}</strong> equipes processadas</p>
                    <button class="btn" onclick="trocarArquivo()">
                        <i class="fas fa-redo"></i> Trocar Arquivo
                    </button>
                `;
                
                atualizarTabela();
                
            } catch (erro) {
                alert('Erro ao processar arquivo: ' + erro.message);
                console.error(erro);
            }
        };
        
        reader.readAsText(file, 'UTF-8');
    });
    
    // Drag and drop
    const uploadArea = document.querySelector('.upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#28a745';
        uploadArea.style.background = '#f0fff0';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.background = 'white';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.background = 'white';
        
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        } else {
            alert('Por favor, selecione um arquivo CSV válido.');
        }
    });
});

// Função para trocar arquivo
function trocarArquivo() {
    document.querySelector('.upload-area').innerHTML = `
        <i class="fas fa-file-upload"></i>
        <h3>Clique ou arraste um arquivo CSV</h3>
        <p>Suporta CSV com tabulação, vírgula ou ponto-e-vírgula</p>
        <input type="file" id="fileInput" accept=".csv">
        <br>
        <button class="btn" onclick="document.getElementById('fileInput').click()">
            <i class="fas fa-upload"></i> Selecionar Arquivo
        </button>
        <button class="btn" onclick="carregarExemplo()" style="background: #28a745">
            <i class="fas fa-vial"></i> Usar Exemplo
        </button>
    `;
    
    // Reativa o event listener
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const texto = e.target.result;
                dadosOriginais = processarCSV(texto);
                alert(`Arquivo carregado! ${dadosOriginais.length} equipes.`);
                atualizarTabela();
            } catch (erro) {
                alert('Erro: ' + erro.message);
            }
        };
        
        reader.readAsText(file);
    });
}
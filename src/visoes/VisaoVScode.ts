import * as vscode from 'vscode';
import { ResultadoAnaliseVulnerabilidade, RiscoVulnerabilidade } from '../analisadores/AnalisadorPacote';
import { ScanPacote } from '../scanners/ScanPacote';
import { Pacote } from '../pacotes/Pacote';

export class VisaoVScode {
    private painel?: vscode.WebviewPanel;
    public vulnerabilidadesCriticas = 0;
    public vulnerabilidadesAltas = 0;
    public vulnerabilidadesMedias = 0;
    public vulnerabilidadesBaixas = 0;
    public arquivosAnalisados = 0;
    
    gerarPainel(titulo: string, scanPacote: ScanPacote) {
        if (this.painel === undefined) {
            this.painel = this.criarPainel(titulo);
        }
        this.painel.onDidDispose(() => {
            this.painel = undefined;
        });
        this.painel.title = titulo;
        this.painel.webview.html = this.gerarHTML(scanPacote);
        this.painel.reveal();
    }

    exibirVulnerabilidades(arquivo: vscode.Uri, conteudoArquivo: string, analiseEstatica: ResultadoAnaliseVulnerabilidade[], analisePacotes?: ResultadoAnaliseVulnerabilidade[]) {
        const html = this.gerarHTMLVulnerabilidades(arquivo, conteudoArquivo, analiseEstatica, analisePacotes);

        this.arquivosAnalisados++;
        this.adicionarVulnerabilidades(analiseEstatica);
        this.adicionarVulnerabilidades(analisePacotes || []);

        this.painel?.webview.postMessage({
            command: 'atualizarResultados',
            dados: {
                html,
                vulnerabilidadesAltas: this.vulnerabilidadesAltas,
                vulnerabilidadesBaixas: this.vulnerabilidadesBaixas,
                vulnerabilidadesCriticas: this.vulnerabilidadesCriticas,
                vulnerabilidadesMedias: this.vulnerabilidadesMedias,
                arquivosAnalisados: this.arquivosAnalisados
            },
        });
    }

    private adicionarVulnerabilidades(analises: ResultadoAnaliseVulnerabilidade[]): void {
        analises.forEach(resultado => {
            if (resultado.vulnerabilidadePresente) {
                switch (resultado.risco) {
                    case RiscoVulnerabilidade.CRITICO:
                        this.vulnerabilidadesCriticas++; 
                        break;
                    case RiscoVulnerabilidade.ALTO:
                        this.vulnerabilidadesAltas++;
                        break;
                    case RiscoVulnerabilidade.MEDIO:
                        this.vulnerabilidadesMedias++;
                        break;
                    case RiscoVulnerabilidade.BAIXO:
                        this.vulnerabilidadesBaixas++;
                        break;
                }
            }
        });
    }

    private criarPainel(titulo: string): vscode.WebviewPanel {
        return vscode.window.createWebviewPanel(
            'scanCodeResults',
            titulo,
            vscode.ViewColumn.One,
            { 
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
    }

    private gerarHTMLVulnerabilidades(arquivo: vscode.Uri, conteudoArquivo: string, analiseEstatica: ResultadoAnaliseVulnerabilidade[], analisePacotes?: ResultadoAnaliseVulnerabilidade[]): string {
        if (analiseEstatica.length === 0 && (!analisePacotes || analisePacotes.length === 0)) {
            return '';
        }
        const id = Math.random().toString(16).substring(2, 18).padEnd(16, '0');
        const vulnerabilidades = analiseEstatica;
        analisePacotes?.forEach(vuln => vulnerabilidades.push(vuln));
        let html = '';
        // ordernar por severidade
        for (const vuln of vulnerabilidades) {
            const severidadeClass = vuln.risco?.toString().toLowerCase();
            let vulnerabilidadesHTML = '';

            for (const codigoVuln of vuln.codigosVulneraveis || []) {
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(arquivo);
                const relativePath = workspaceFolder 
                    ? vscode.workspace.asRelativePath(arquivo, false)
                    : arquivo.fsPath;
                
                vulnerabilidadesHTML += `
                    <div>
                        <div class="vuln-location">
                            📁 ${relativePath}:${codigoVuln.inicio}
                        </div>
                        <div class="vuln-code">${this.escapeHtml(codigoVuln, conteudoArquivo)}</div>
                    </div>
                `;
            }

            let sugestao = "";
            if (vuln.sugestaoCorrecao && vuln.sugestaoCorrecao != "") {
              sugestao = `
                      <div class="vuln-recommendation">
                          <strong>💡 Recomendação:</strong>
                          ${
                            vuln.sugestaoCorrecao ??
                            "Nenhuma recomendação disponível."
                          }
                      </div>
                      `;
            }
            
            html += `
                <div class="vuln-item ${severidadeClass}">
                    <div class="vuln-header">
                        <div class="vuln-title">${vuln.impacto}</div>
                        <span class="severity-badge ${severidadeClass}">${severidadeClass?.toUpperCase()}</span>
                    </div>
                    <div class="vuln-details">
                        <p>${vuln.problemaDetectado ?? 'Problema desconhecido'}</p>
                        ${sugestao}
                        ${vulnerabilidadesHTML}
                    </div>
                </div>
            `;
        }
        return `
            <div class="section">
                <div class="section-header" onclick="toggleSection('${id}')">
                    <h2>🔍 Arquivo ${arquivo.fsPath}</h2>
                    <div>
                        <span class="badge">${analiseEstatica.length + (analisePacotes?.length || 0)} vulnerabilidades</span>
                        <span id="${id}-icon" class="expand-icon expanded">▶</span>
                    </div>
                </div>
                <div id="${id}" class="section-content expanded">
                    ${html}
                </div>
`;
    }

    private escapeHtml(codigoVuln: { inicio: number; fim: number }, conteudoArquivo: string): string {
        const inicio = Math.max(codigoVuln.inicio - 3, 0);
        const fim = Math.min(conteudoArquivo.split('\n').length, codigoVuln.fim + 3);
        const linhas = conteudoArquivo.split('\n').slice(inicio, fim);
        const codigoFormatado = linhas
            .map((linha, index) => {
            const numeroLinha = inicio + index + 1;
            const linhaEscapada = linha
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `<span class="line-number">${numeroLinha}</span>${linhaEscapada}`;
            })
            .join('\n');
        
        return `<pre>${codigoFormatado}</pre>`;
    }

    private gerarHTML(scan: ScanPacote): string {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scan Code - Resultado</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        h1 {
            font-size: 28px;
            margin-bottom: 10px;
            color: var(--vscode-titleBar-activeForeground);
        }

        .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 30px;
            font-size: 14px;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }

        .summary-card {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }

        .summary-card h3 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .summary-card p {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }

        .critica { color: #f85149; }
        .alta { color: #f0883e; }
        .media { color: #d29922; }
        .baixa { color: #3fb950; }

        .section {
            margin-bottom: 30px;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background-color: var(--vscode-editorGroupHeader-tabsBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            cursor: pointer;
            user-select: none;
        }

        .section-header:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .section-header h2 {
            font-size: 18px;
            font-weight: 600;
        }

        .badge {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }

        .section-content {
            margin-top: 10px;
            display: none;
        }

        .section-content.expanded {
            display: block;
        }

        .vuln-item {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-left: 4px solid;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
        }

        .vuln-item.critica { border-left-color: #f85149; }
        .vuln-item.alta { border-left-color: #f0883e; }
        .vuln-item.media { border-left-color: #d29922; }
        .vuln-item.baixa { border-left-color: #3fb950; }

        .vuln-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 10px;
        }

        .vuln-title {
            font-weight: 600;
            font-size: 16px;
        }

        .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .severity-badge.critico { background-color: #f85149; color: white; }
        .severity-badge.alto { background-color: #f0883e; color: white; }
        .severity-badge.medio { background-color: #d29922; color: white; }
        .severity-badge.baixo { background-color: #3fb950; color: white; }

        .vuln-details {
            font-size: 13px;
            line-height: 1.6;
        }

        .vuln-location {
            color: var(--vscode-descriptionForeground);
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 8px 0;
        }

        .vuln-code {
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 8px 0;
            overflow-x: auto;
        }

        .vuln-recommendation {
            background-color: var(--vscode-inputValidation-infoBackground);
            border-left: 3px solid var(--vscode-inputValidation-infoBorder);
            padding: 10px;
            margin-top: 8px;
            border-radius: 4px;
            font-size: 13px;
        }

        .vuln-recommendation strong {
            display: block;
            margin-bottom: 5px;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }

        .package-item {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-left: 4px solid #f85149;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
        }

        .package-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 8px;
        }

        .package-vulns {
            margin-left: 15px;
        }

        .package-vuln {
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .package-vuln:last-child {
            border-bottom: none;
        }

        .expand-icon {
            transition: transform 0.2s;
        }

        .expand-icon.expanded {
            transform: rotate(90deg);
        }
    </style>
</head>
<body>
    <div class="container main">
        <h1>🛡️ Scan Code - Resultados da Análise</h1>
        <p class="subtitle">Análise completa de segurança do seu código</p>

        <div class="summary">
            <div class="summary-card">
                <h3 class="critica">${scan.pacotesVulneraveis.length}</h3>
                <p>Pacotes Vulneráveis</p>
            </div>
            <div class="summary-card">
                <h3 class="arquivos-analisados">0</h3>
                <p>Arquivos Analisados</p>
            </div>
            <div class="summary-card">
                <h3 class="critica vulns-critica">0</h3>
                <p>Vulnerabilidades Críticas</p>
            </div>
            <div class="summary-card">
                <h3 class="alta vulns-alta">0</h3>
                <p>Vulnerabilidades Altas</p>
            </div>
            <div class="summary-card">
                <h3 class="media vulns-media">0</h3>
                <p>Vulnerabilidades Médias</p>
            </div>
            <div class="summary-card">
                <h3 class="baixa vulns-baixa">0</h3>
                <p>Vulnerabilidades Baixas</p>
            </div>
        </div>

        ${this.gerarSecaoDependencias(scan.pacotesVulneraveis)}
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Restaurar estado ao carregar
        const estadoAnterior = vscode.getState();
        if (estadoAnterior) {
            restaurarEstado(estadoAnterior);
        }

        function toggleSection(id) {
            const content = document.getElementById(id);
            const icon = document.getElementById(id + '-icon');
            
            if (content.classList.contains('expanded')) {
                content.classList.remove('expanded');
                icon.classList.remove('expanded');
            } else {
                content.classList.add('expanded');
                icon.classList.add('expanded');
            }
        }

        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'atualizarResultados':
                    // Atualizar contadores
                    document.querySelector('.vulns-critica').textContent = message.dados.vulnerabilidadesCriticas.toString();
                    document.querySelector('.vulns-alta').textContent = message.dados.vulnerabilidadesAltas.toString();
                    document.querySelector('.vulns-media').textContent = message.dados.vulnerabilidadesMedias.toString();
                    document.querySelector('.vulns-baixa').textContent = message.dados.vulnerabilidadesBaixas.toString();
                    document.querySelector('.arquivos-analisados').textContent = message.dados.arquivosAnalisados.toString();
                    document.querySelector('.main').innerHTML += message.dados.html;
                    break;
            }
        });

        function salvarEstado() {
            const estado = {
                vulnerabilidadesCriticas: parseInt(document.querySelector('.vulns-critica').textContent) || 0,
                vulnerabilidadesAltas: parseInt(document.querySelector('.vulns-alta').textContent) || 0,
                vulnerabilidadesMedias: parseInt(document.querySelector('.vulns-media').textContent) || 0,
                vulnerabilidadesBaixas: parseInt(document.querySelector('.vulns-baixa').textContent) || 0,
                arquivosAnalisados: parseInt(document.querySelector('.arquivos-analisados').textContent) || 0,
                htmlContent: document.querySelector('.main').innerHTML
            };
            vscode.setState(estado);
        }
        
        function restaurarEstado(estado) {
            if (estado.vulnerabilidadesCriticas !== undefined) {
                document.querySelector('.vulns-critica').textContent = estado.vulnerabilidadesCriticas.toString();
                document.querySelector('.vulns-alta').textContent = estado.vulnerabilidadesAltas.toString();
                document.querySelector('.vulns-media').textContent = estado.vulnerabilidadesMedias.toString();
                document.querySelector('.vulns-baixa').textContent = estado.vulnerabilidadesBaixas.toString();
                document.querySelector('.arquivos-analisados').textContent = estado.arquivosAnalisados.toString();
                
                if (estado.htmlContent) {
                    document.querySelector('.main').innerHTML = estado.htmlContent;
                }
            }
        }
    </script>
</body>
</html>
`;
    }

    private gerarSecaoDependencias(pacotesVulneraveis: Pacote[]): string {
        if (pacotesVulneraveis.length === 0) {
            return `
                <div class="section">
                    <div class="section-header">
                        <h2>📦 Dependências Vulneráveis</h2>
                        <span class="badge">0 pacotes</span>
                    </div>
                    <div class="section-content expanded">
                        <div class="empty-state">
                            <div class="empty-state-icon">✅</div>
                            <p>Nenhuma dependência vulnerável encontrada!</p>
                        </div>
                    </div>
                </div>
            `;
        }

        let html = `
            <div class="section">
                <div class="section-header" onclick="toggleSection('deps')">
                    <h2>📦 Dependências Vulneráveis</h2>
                    <div>
                        <span class="badge">${pacotesVulneraveis.length} pacotes</span>
                        <span id="deps-icon" class="expand-icon expanded">▶</span>
                    </div>
                </div>
                <div id="deps" class="section-content expanded">
        `;

        for (const pacote of pacotesVulneraveis) {
            html += `
                <div class="package-item">
                    <div class="package-name">${pacote.nome}@${pacote.versao}</div>
                    <div class="package-vulns">
            `;

            for (const vuln of pacote.vulnerabilidades) {
                html += `
                    <div class="package-vuln">
                        <strong>${vuln.id || 'Vulnerabilidade Desconhecida'}</strong>
                        <p>${vuln.summary || 'Sem descrição disponível'}</p>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }
}
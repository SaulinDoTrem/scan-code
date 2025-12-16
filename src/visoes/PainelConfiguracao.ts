import * as vscode from 'vscode';

export type ConfiguracaoScanCode = {
    modeloIA: 'copilot' | 'ollama';
    modeloCopilot: string;
    urlOllama?: string;
    modeloOllama?: string;
};

export class GerenciadorConfiguracao {
    private static readonly CONFIG_KEY = 'scanCode';

    public static obterConfiguracao(): ConfiguracaoScanCode {
        const config = vscode.workspace.getConfiguration(this.CONFIG_KEY);
        
        return {
            modeloIA: config.get('modeloIA', 'copilot'),
            modeloCopilot: config.get('modeloCopilot', 'claude-sonnet-4.5'),
            urlOllama: config.get('urlOllama', 'http://localhost:11434'),
            modeloOllama: config.get('modeloOllama', 'llama2'),
        };
    }

    public static async salvarConfiguracao(config: Partial<ConfiguracaoScanCode>) {
        const vsconfig = vscode.workspace.getConfiguration(this.CONFIG_KEY);
        
        if (config.modeloIA !== undefined) {
            await vsconfig.update('modeloIA', config.modeloIA, vscode.ConfigurationTarget.Global);
        }
        if (config.modeloCopilot !== undefined) {
            await vsconfig.update('modeloCopilot', config.modeloCopilot, vscode.ConfigurationTarget.Global);
        }
        if (config.urlOllama !== undefined) {
            await vsconfig.update('urlOllama', config.urlOllama, vscode.ConfigurationTarget.Global);
        }
        if (config.modeloOllama !== undefined) {
            await vsconfig.update('modeloOllama', config.modeloOllama, vscode.ConfigurationTarget.Global);
        }
    }
}

export class PainelConfiguracao {
    private panel: vscode.WebviewPanel | undefined;

    public mostrar() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'scanCodeConfig',
                'Scan Code - Configurações',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });

            this.panel.webview.onDidReceiveMessage(
                async (message: any) => {
                    if (message.command === 'salvar') {
                        await GerenciadorConfiguracao.salvarConfiguracao(message.config);
                        vscode.window.showInformationMessage('Configurações salvas com sucesso!');
                    } else if (message.command === 'carregar') {
                        const config = GerenciadorConfiguracao.obterConfiguracao();
                        this.panel?.webview.postMessage({ command: 'config', data: config });
                    }
                }
            );
        }

        this.panel.webview.html = this.gerarHTML();
        
        // Enviar configuração atual após um pequeno delay para garantir que a webview está pronta
        const config = GerenciadorConfiguracao.obterConfiguracao();
        Promise.resolve().then(() => {
            this.panel?.webview.postMessage({ command: 'config', data: config });
        });
    }

    private gerarHTML(): string {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurações</title>
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
            max-width: 800px;
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

        .section {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .section h2 {
            font-size: 18px;
            margin-bottom: 15px;
            color: var(--vscode-titleBar-activeForeground);
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
        }

        .form-group .description {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            margin-bottom: 8px;
        }

        select, input[type="text"], input[type="url"] {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 14px;
        }

        select:focus, input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        .radio-group {
            display: flex;
            gap: 20px;
            margin-top: 8px;
        }

        .radio-option {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .radio-option input[type="radio"] {
            width: auto;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            background-color: var(--vscode-textCodeBlock-background);
            border-radius: 6px;
        }

        .checkbox-group input[type="checkbox"] {
            width: auto;
        }

        .conditional-section {
            margin-top: 15px;
            padding: 15px;
            background-color: var(--vscode-textCodeBlock-background);
            border-left: 3px solid var(--vscode-inputValidation-infoBorder);
            border-radius: 4px;
            display: none;
        }

        .conditional-section.visible {
            display: block;
        }

        .buttons {
            display: flex;
            gap: 10px;
            margin-top: 30px;
        }

        button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        button:hover {
            opacity: 0.9;
        }

        button.primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .info-box {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 13px;
        }

        .info-box strong {
            display: block;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ Configurações do Scan Code</h1>
        <p class="subtitle">Configure o comportamento do scanner de segurança</p>

        <div class="section">
            <h2>🤖 Modelo de IA</h2>
            <div class="form-group">
                <label>Provedor de IA</label>
                <div class="description">Escolha qual modelo de IA usar para análise de vulnerabilidades</div>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="copilot" name="modeloIA" value="copilot" checked>
                        <label for="copilot">GitHub Copilot</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="ollama" name="modeloIA" value="ollama">
                        <label for="ollama">Ollama (Local)</label>
                    </div>
                </div>
            </div>

            <div id="copilot-config" class="conditional-section visible">
                <div class="form-group">
                    <label for="modeloCopilot">Modelo do Copilot</label>
                    <select id="modeloCopilot">
                        <option value="claude-sonnet-4.5">Claude Sonnet 4.5</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="o1-preview">O1 Preview</option>
                    </select>
                </div>
            </div>

            <div id="ollama-config" class="conditional-section">
                <div class="form-group">
                    <label for="urlOllama">URL do Ollama</label>
                    <input type="url" id="urlOllama" placeholder="http://localhost:11434">
                </div>
                <div class="form-group">
                    <label for="modeloOllama">Modelo do Ollama</label>
                    <input type="text" id="modeloOllama" placeholder="llama2">
                </div>
            </div>
        </div

        <div class="buttons">
            <button class="primary" onclick="salvar()">💾 Salvar Configurações</button>
            <button class="secondary" onclick="restaurarPadroes()">🔄 Restaurar Padrões</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Carregar configuração ao iniciar
        window.addEventListener('load', () => {
            vscode.postMessage({ command: 'carregar' });
        });

        // Receber configuração do backend
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'config') {
                carregarConfiguracao(message.data);
            }
        });

        // Toggle entre Copilot e Ollama
        document.querySelectorAll('input[name="modeloIA"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const copilotConfig = document.getElementById('copilot-config');
                const ollamaConfig = document.getElementById('ollama-config');
                
                if (e.target.value === 'copilot') {
                    copilotConfig.classList.add('visible');
                    ollamaConfig.classList.remove('visible');
                } else {
                    copilotConfig.classList.remove('visible');
                    ollamaConfig.classList.add('visible');
                }
            });
        });

        function carregarConfiguracao(config) {
            document.getElementById(config.modeloIA).checked = true;
            document.getElementById('modeloCopilot').value = config.modeloCopilot;
            document.getElementById('urlOllama').value = config.urlOllama || '';
            document.getElementById('modeloOllama').value = config.modeloOllama || '';

            // Atualizar visualização
            const event = new Event('change');
            document.querySelector('input[name="modeloIA"]:checked').dispatchEvent(event);
        }

        function salvar() {
            const config = {
                modeloIA: document.querySelector('input[name="modeloIA"]:checked').value,
                modeloCopilot: document.getElementById('modeloCopilot').value,
                urlOllama: document.getElementById('urlOllama').value,
                modeloOllama: document.getElementById('modeloOllama').value,
            };

            vscode.postMessage({
                command: 'salvar',
                config: config
            });
        }

        function restaurarPadroes() {
            const config = {
                modeloIA: 'copilot',
                modeloCopilot: 'claude-sonnet-4.5',
                urlOllama: 'http://localhost:11434',
                modeloOllama: 'llama2',
            };

            carregarConfiguracao(config);
        }
    </script>
</body>
</html>`;
    }
}

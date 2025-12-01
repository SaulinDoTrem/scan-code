import * as vscode from 'vscode';
import { AnalisadorEstatico } from './scanners/AnalisadorEstatico';
import { VisualizadorResultados } from './visoes/VisualizadorResultados';
import { Scan } from './scanners/Scan';
import { GerenciadorConfiguracao } from './visoes/PainelConfiguracao';
import { ConectorIA } from './ia/ConectorIA';
import { SeletorModeloCopilot } from './ia/SeletorModeloCopilot';
import { CopilotConector } from './ia/CopilotConector';
import { OllamaConector } from './ia/OllamaConector';
import { LeitorArquivo } from './leitores/LeitorArquivo';
import { OSVConector } from './osv/OSVConector';
import { AnalisadorVulnerabilidade } from './analisadores/AnalisadorVulnerabilidade';
import { PacoteScanner } from './scanners/PacoteScanner';
import { PainelConfiguracao } from './visoes/PainelConfiguracao';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Extensão "scan-code" está ativa!');

	// Comando para escanear o código
	const scanDisposable = vscode.commands.registerCommand('scan-code.scan', async () => {
		try {
			// Verificar se há uma pasta de trabalho aberta
			if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
				vscode.window.showErrorMessage('❌ Nenhuma pasta de trabalho aberta! Abra uma pasta ou projeto antes de executar o scan.');
				return;
			}

			// Obter configurações
			const config = GerenciadorConfiguracao.obterConfiguracao();
			
			// Mostrar progresso
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Scan Code",
				cancellable: false
			}, async (progress) => {
				progress.report({ message: "Iniciando análise..." });

				let scan;
				
				// Análise de dependências
				if (config.habilitarAnaliseDependencias) {
					progress.report({ message: "Analisando dependências..." });
					
					// Configurar IA
					let ia: ConectorIA;
					if (config.modeloIA === 'copilot') {
						const seletorModelo = new SeletorModeloCopilot();
						const modelo = await seletorModelo.selecionarModelo(config.modeloCopilot);
						ia = new CopilotConector(modelo);
					} else {
						ia = new OllamaConector(config.urlOllama || 'http://localhost:11434', config.modeloOllama || 'llama2');
					}

					const leitor = new LeitorArquivo();
					const conector = new OSVConector();
					const analisador = new AnalisadorVulnerabilidade(ia);
					const scanner = new PacoteScanner(conector, leitor, analisador);
					scan = await scanner.scan();
				} else {
					// Se análise de dependências está desabilitada, criar Scan vazio
					const { Scan } = await import('./scanners/Scan.js');
					scan = new Scan([], []);
				}

				// Análise estática
				if (config.habilitarAnaliseEstatica) {
					progress.report({ message: "Realizando análise estática..." });
					const analisadorEstatico = new AnalisadorEstatico();
					const resultadoEstatico = await analisadorEstatico.analisar();
					scan.analiseEstatica = resultadoEstatico;
				}

				progress.report({ message: "Gerando relatório..." });
				
				// Mostrar resultados
				const visualizador = new VisualizadorResultados();
				visualizador.mostrarResultados(scan);

				// Mensagem de conclusão
				const totalVulns = (scan.pacotesVulneraveis?.length || 0) + 
								  (scan.analiseEstatica?.vulnerabilidades.length || 0);
				
				if (totalVulns === 0) {
					vscode.window.showInformationMessage('✅ Nenhuma vulnerabilidade encontrada!');
				} else {
					vscode.window.showWarningMessage(
						`⚠️ Encontradas ${totalVulns} vulnerabilidade(s). Verifique o relatório.`
					);
				}
			});

		} catch (e) {
			console.error('Erro durante o scan:', e);
			vscode.window.showErrorMessage(`Erro ao realizar scan: ${(e as Error).message}`);
		}
	});

	// Comando para abrir configurações
	const configDisposable = vscode.commands.registerCommand('scan-code.config', () => {
		const painel = new PainelConfiguracao();
		painel.mostrar();
	});

	// Comando para executar análise de segurança
	const analisarSegurancaDisposable = vscode.commands.registerCommand('scan-code.executarAnalise', async () => {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('Nenhuma pasta de trabalho aberta!');
			return;
		}

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Scan Code",
			cancellable: false
		}, async (progress) => {
			progress.report({ message: "Iniciando análise de segurança..." });

			progress.report({ message: "Analisando dependências..." });
			const config = GerenciadorConfiguracao.obterConfiguracao();
			
			// Configurar IA
			let ia: ConectorIA;
			if (config.modeloIA === 'copilot') {
				const seletorModelo = new SeletorModeloCopilot();
				const modelo = await seletorModelo.selecionarModelo(config.modeloCopilot);
				ia = new CopilotConector(modelo);
			} else {
				ia = new OllamaConector(config.modeloOllama || 'llama2', config.urlOllama || 'http://localhost:11434');
			}

			const leitor = new LeitorArquivo();
			const conector = new OSVConector();
			const analisador = new AnalisadorVulnerabilidade(ia);
			const scanner = new PacoteScanner(conector, leitor, analisador);
			const scanDependencias = await scanner.scan();

			progress.report({ message: "Analisando código fonte..." });
			const analisadorEstatico = new AnalisadorEstatico();
			const analiseEstatica = await analisadorEstatico.analisar();

			const scan = new Scan(
				scanDependencias.pacotesVulneraveis, 
				scanDependencias.pacotesNaoEncontrados,
				scanDependencias.analise,
				analiseEstatica
			);

			progress.report({ message: "Gerando relatório..." });
			const visualizador = new VisualizadorResultados();
			visualizador.mostrarResultados(scan);

			vscode.window.showInformationMessage('✅ Análise de segurança concluída!');
		});
	});

	context.subscriptions.push(scanDisposable, configDisposable, analisarSegurancaDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {

}

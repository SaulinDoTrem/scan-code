import * as vscode from 'vscode';
import { GerenciadorConfiguracao, PainelConfiguracao } from './visoes/PainelConfiguracao';
import { ScanControladora } from './controladoras/ScanControladora';
import { VisaoVScode } from './visoes/VisaoVScode';
import { ConectorIA } from './ia/ConectorIA';
import { SeletorModeloCopilot } from './ia/SeletorModeloCopilot';
import { CopilotConector } from './ia/CopilotConector';
import { OllamaConector } from './ia/OllamaConector';
import { AnalisadorPacote } from './analisadores/AnalisadorPacote';
import { FormatadorRespostaIA } from './analisadores/FormatadorRespostaIA';
import { PacoteScanner } from './scanners/PacoteScanner';
import { OSVConector } from './osv/OSVConector';
import { LeitorArquivo } from './leitores/LeitorArquivo';
import { AnalisadorCodigo } from './analisadores/AnalisadorCodigo';
import { BuscadorArquivo } from './leitores/BuscadorArquivo';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Comando para escanear o código
	const scanDisposable = vscode.commands.registerCommand('scan-code.scan', async () => {
		const visao = new VisaoVScode();
		const config = GerenciadorConfiguracao.obterConfiguracao();

		let ia: ConectorIA;
		const formatador = new FormatadorRespostaIA();
		if (config.modeloIA === 'copilot') {
			const seletorModelo = new SeletorModeloCopilot();
			const modelo = await seletorModelo.selecionarModelo(config.modeloCopilot);
			ia = new CopilotConector(modelo);
		} else {
			ia = new OllamaConector(config.urlOllama || 'http://localhost:11434', config.modeloOllama || 'llama2');
		}

		const analisador = new AnalisadorPacote(ia, formatador);
		const analisadorEstatico = new AnalisadorCodigo(ia, formatador);
		const leitorArquivo = new LeitorArquivo();
		const scanner = new PacoteScanner(new OSVConector(), leitorArquivo);
		const buscadorArquivo = new BuscadorArquivo();
		
		const controladora = new ScanControladora(visao, scanner, analisador, analisadorEstatico, buscadorArquivo, leitorArquivo);
		await controladora.scan();
	});

	// Comando para abrir configurações
	const configDisposable = vscode.commands.registerCommand('scan-code.config', () => {
		const painel = new PainelConfiguracao();
		painel.mostrar();
	});

	context.subscriptions.push(scanDisposable, configDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {

}

import * as vscode from 'vscode';
import { OSVConector } from './osv/OSVConector';
import { PacoteScanner } from './scanners/PacoteScanner';
import { LeitorArquivo } from './leitores/LeitorArquivo';
import { CopilotConector } from './ia/CopilotConector';
import { SeletorModeloCopilot } from './ia/SeletorModeloCopilot';
import { AnalisadorVulnerabilidade } from './analisadores/AnalisadorVulnerabilidade';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('scan-code.scan', async () => {
		try {
			vscode.window.showInformationMessage('Escaneando suas dependências...');
			const seletorModelo = new SeletorModeloCopilot();
			const modelo = await seletorModelo.selecionarModelo('claude-sonnet-4.5');
			const ia = new CopilotConector(modelo);
			const leitor = new LeitorArquivo();
			const conector = new OSVConector();
			const analisador = new AnalisadorVulnerabilidade(ia);
			const scanner = new PacoteScanner(conector, leitor, analisador);
			const scan = await scanner.scan();
			console.log(scan.pacotesVulneraveis, scan.analise);
			vscode.window.showErrorMessage(`Você tem ${scan.pacotesVulneraveis.length} pacote(s) vulnerável(is).`);
 		} catch (e) {
			console.log('##############################');
			console.log('DEU ERRO AI CARAIO');
			console.log('##############################');
			console.log((e as Error).message);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {

}

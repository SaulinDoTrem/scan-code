import { AnalisadorCodigo } from "../analisadores/AnalisadorCodigo";
import { AnalisadorPacote } from "../analisadores/AnalisadorPacote";
import { FormatadorRespostaIA } from "../analisadores/FormatadorRespostaIA";
import { CopilotConector } from "../ia/CopilotConector";
import { SeletorModeloCopilot } from "../ia/SeletorModeloCopilot";
import { BuscadorArquivo } from "../leitores/BuscadorArquivo";
import { LeitorArquivo } from "../leitores/LeitorArquivo";
import { OSVConector } from "../osv/OSVConector";
import { Pacote } from "../pacotes/Pacote";
import { PacoteScanner } from "../scanners/PacoteScanner";
import * as vscode from 'vscode';
import { VisaoVScode } from "../visoes/VisaoVScode";
import { ConfiguracaoScanCode } from "../visoes/PainelConfiguracao";
import { ConectorIA } from "../ia/ConectorIA";
import { ProcessadorLotes } from "../utils/ProcessadorLotes";

export class ScanControladora {
    constructor(
        private readonly visao: VisaoVScode,
        private pacoteScanner: PacoteScanner,
        private analisador: AnalisadorPacote,
        private analisadorEstatico: AnalisadorCodigo,
        private buscadorArquivo: BuscadorArquivo,
        private leitorArquivo: LeitorArquivo
    ) {
    }

    async scan() {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Scan Code",
            cancellable: false
        }, async (progress) => {
            progress.report({ message: "Iniciando análise..." });
            if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('❌ Nenhuma pasta de trabalho aberta! Abra uma pasta ou projeto antes de executar o scan.');
                return;
            }
    
            progress.report({ message: "Analisando dependências..." });
            const promiseArquivos = this.buscadorArquivo.buscarArquivosDoWorkspace(vscode.workspace.workspaceFolders[0]);
            const promisePacotes = this.pacoteScanner.scan();
            
            const [respostaArquivos, respostaPacotes] = await Promise.allSettled([promiseArquivos, promisePacotes]);
    
            if (respostaArquivos.status === 'rejected') {
                throw new Error(`Erro ao buscar arquivos no workspace: ${respostaArquivos.reason}`);
            }
    
            if (respostaPacotes.status === 'rejected') {
                throw new Error(`Erro ao scanear pacotes: ${respostaPacotes.reason}`);
            }
    
            const scanPacote = respostaPacotes.value;
            const arquivosUris = respostaArquivos.value;
    
            this.visao.gerarPainel('Scan Code', scanPacote);
    
            const totalArquivos = arquivosUris.length;
            let index = 0;
            progress.report({ message: `Realizando análise estática... (${index}/${totalArquivos})` });
            await ProcessadorLotes.processar(arquivosUris, async (arquivo) => {
                index++;
                progress.report({ message: `Realizando análise estática... (${index}/${totalArquivos})` });
                try {
                    const conteudo = await this.leitorArquivo.ler(arquivo);
                    const analiseEstatica = await this.analisadorEstatico.analisar(conteudo);
                    const pacotesUtilizados: Pacote[] = [];
                    scanPacote.pacotesVulneraveis.forEach(pacote => {
                        if (this.leitorArquivo.arquivoUtilizaPacote(conteudo, pacote)) {
                            pacotesUtilizados.push(pacote);
                        }
                    });
                    let analisePacotes = undefined; 
                    if (pacotesUtilizados.length > 0) {
                        analisePacotes = await this.analisador.procurarVulnerabilidadesEmCodigo(arquivo, conteudo, pacotesUtilizados);
                    }

                    this.visao.exibirVulnerabilidades(arquivo, conteudo, analiseEstatica, analisePacotes);
                } catch (e) {
                    vscode.window.showWarningMessage(`Erro ao analisar o arquivo ${arquivo.fsPath}`);
                }
            });

            const totalVulns = this.visao.vulnerabilidadesCriticas + this.visao.vulnerabilidadesAltas + this.visao.vulnerabilidadesMedias + this.visao.vulnerabilidadesBaixas;
				
            if (totalVulns === 0) {
                vscode.window.showInformationMessage('✅ Nenhuma vulnerabilidade encontrada!');
            } else {
                vscode.window.showWarningMessage(
                    `⚠️ Encontradas ${totalVulns} vulnerabilidade(s). Verifique o relatório.`
                );
            }
        });
    }
}
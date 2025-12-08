import { DominioError } from "../errors/DominioError";
import { LeitorArquivo } from "../leitores/LeitorArquivo";
import { Conector } from "../osv/Conector";
import { Pacote } from "../pacotes/Pacote";
import * as vscode from 'vscode';
import { ScanPacote } from "./ScanPacote";

export class PacoteScanner {

    constructor(
        private readonly conectorAPI: Conector,
        private readonly leitorArquivo: LeitorArquivo,
    ) {
    }

    async scan(): Promise<ScanPacote> {
        const pacotes = await this.lerPacotes();
        const scan = await this.consultarVulnerabilidades(pacotes);
        return scan;
    }

    private async lerPacotes(): Promise<Pacote[]> {
        const folder = vscode.workspace.workspaceFolders?.[0];
        if (!folder) {
            throw new DominioError('Workspace não encontrado.');
        }

        const packageJsonPath = vscode.Uri.joinPath(folder.uri, 'package.json');
        const packageJson = await this.leitorArquivo.ler(packageJsonPath);
        const pacotes: Pacote[] = this.extrairPacotesNPM(JSON.parse(packageJson));

        if (pacotes.length == 0) {
            throw new DominioError('Nenhum pacote encontrado.');
        }
        return pacotes;
    }

    private async consultarVulnerabilidades(pacotes: Pacote[]): Promise<ScanPacote> {
        const requisicoes = pacotes.map((pacote) => this.conectorAPI.consultarPacote(pacote));
        const respostas = await Promise.allSettled(requisicoes);
        const pacotesVulneraveis: Pacote[] = [];
        const pacotesNaoEncontrados: Pacote[] = [];
        respostas.forEach(async (resposta, index) => {
            if (resposta.status == 'fulfilled') {
                const pacote = pacotes.at(index)!;
                if (resposta.value === undefined) {
                    pacotesNaoEncontrados.push(pacote);
                    return;
                }
                pacote.vulnerabilidades = resposta.value;
                pacotesVulneraveis.push(pacote);
            } else {
                console.log(`Erro ao consultar o pacote: ${resposta.reason}`);
            }
        });
        return new ScanPacote(pacotesVulneraveis, pacotesNaoEncontrados);
    }

    private extrairPacotesNPM(packageJson: any): Pacote[] {
        const pacotes: Pacote[] = [];
        
        if (packageJson.dependencies) {
            this.adicionarPacotesNaLista(packageJson.dependencies, pacotes);
        }

        if (packageJson.devDependencies) {
            this.adicionarPacotesNaLista(packageJson.devDependencies, pacotes);
        };

        return pacotes;
    }

    private adicionarPacotesNaLista(pacotes: any, array: Pacote[]): void {
        if (typeof pacotes !== 'object') {
            throw new DominioError();
        }

        for (const [chave, valor] of Object.entries(pacotes)) {
            if (typeof valor !== 'string') {
                throw new DominioError();
            }
            array.push(new Pacote(chave, valor));
        }
    }
}
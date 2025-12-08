import * as fs from 'fs/promises';
import * as vscode from 'vscode';
import { Pacote } from '../pacotes/Pacote';

export class LeitorArquivo {
    async ler(caminhoArquivo: vscode.Uri): Promise<string> {
        const conteudo = await fs.readFile(caminhoArquivo.fsPath, 'utf-8');
        return conteudo;
    }

    arquivoUtilizaPacote(arquivo: string, pacote: Pacote): boolean {
        const patterns = [
            // import ... from 'pacote'
            new RegExp(`import\\s+.*from\\s+['"]${pacote.nome}['"]`, 'i'),
            // import 'pacote'
            new RegExp(`import\\s+['"]${pacote.nome}['"]`, 'i'),
            // require('pacote')
            new RegExp(`require\\s*\\(\\s*['"]${pacote.nome}['"]\\s*\\)`, 'i'),
            // import ... from 'pacote/subpath'
            new RegExp(`import\\s+.*from\\s+['"]${pacote.nome}/`, 'i'),
            // require('pacote/subpath')
            new RegExp(`require\\s*\\(\\s*['"]${pacote.nome}/`, 'i')
        ];

        return patterns.some(pattern => pattern.test(arquivo));
    }
}
import * as vscode from 'vscode';

export class BuscadorArquivo {
    async buscarArquivosDoWorkspace(workspace?: vscode.WorkspaceFolder): Promise<vscode.Uri[]> {
        if (!workspace) {
            throw new Error('Nenhum workspace aberto.');
        }

        const arquivos = await vscode.workspace.findFiles(
            '**/*.{ts,js,tsx,jsx}',
            '**/{node_modules,spec,test}/**'
        );
        
        return arquivos.filter(uri => 
            !uri.path.includes('.spec.ts') && 
            !uri.path.includes('.spec.js')
        );
    }
}
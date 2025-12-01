import * as vscode from 'vscode';
import { ConectorIA } from './ConectorIA';

/**
 * Conector para GitHub Copilot (via VS Code Language Model API)
 */
export class CopilotConector implements ConectorIA {
    constructor(
        private readonly modelo: vscode.LanguageModelChat
    ) {}

    async prompt(prompt: string): Promise<string> {

        // Preparar mensagem
        const messages = [
            vscode.LanguageModelChatMessage.User(prompt)
        ];

        // Enviar requisição
        const response = await this.modelo.sendRequest(
            messages,
            {},
            new vscode.CancellationTokenSource().token
        );

        // Coletar resposta
        let resultado = '';
        for await (const chunk of response.text) {
            resultado += chunk;
        }

        return resultado;
    }

    /**
     * Verifica se o Copilot está disponível
     */
    async verificarDisponibilidade(): Promise<boolean> {
        try {
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot'
            });
            return models.length > 0;
        } catch {
            return false;
        }
    }
}

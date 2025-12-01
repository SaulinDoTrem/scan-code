import * as vscode from "vscode";
import { LanguageModelChat } from "vscode";
import { DominioError } from "../errors/DominioError";

export class SeletorModeloCopilot {
    async selecionarModelo(id: string): Promise<LanguageModelChat> {
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            id
        });

        if (models.length == 0) {
            throw new DominioError('Modelo de IA não encontrado.');
        }
        return models[0];
    }
}
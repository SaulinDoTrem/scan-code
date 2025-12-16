import { ConectorIA } from './ConectorIA';

/**
 * Conector para Ollama (IA local)
 */
export class OllamaConector implements ConectorIA {
    constructor(
        private readonly baseUrl: string = 'http://localhost:11434',
        private readonly modelo: string = 'llama2'
    ) {}

    async prompt(prompt: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.modelo,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API retornou status ${response.status}`);
            }

            const data = await response.json() as { response: string };
            return data.response;
        } catch (error) {
            throw new Error(`Erro ao conectar com Ollama: ${(error as Error).message}`);
        }
    }

    /**
     * Verifica se o Ollama está rodando
     */
    async verificarDisponibilidade(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Lista modelos disponíveis
     */
    async listarModelos(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                return [];
            }
            const data = await response.json() as { models?: { name: string }[] };
            return data.models?.map((m: any) => m.name) || [];
        } catch {
            return [];
        }
    }
}

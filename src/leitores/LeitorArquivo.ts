import * as fs from 'fs/promises';

export class LeitorArquivo {
    async ler(caminhoArquivo: string): Promise<any> {
        const conteudo = await fs.readFile(caminhoArquivo, 'utf-8');
        return JSON.parse(conteudo);
    }
}
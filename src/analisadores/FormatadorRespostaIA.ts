import { DominioError } from "../errors/DominioError";
import { ResultadoAnaliseVulnerabilidade } from "./AnalisadorPacote";

export class FormatadorRespostaIA {
    tratarResposta(resposta: string): ResultadoAnaliseVulnerabilidade[] {
        try {
            resposta.includes('```json') && (resposta = resposta.split('```json')[1].split('```')[0]);
            const resultado = JSON.parse(resposta).vulnerabilidades as ResultadoAnaliseVulnerabilidade[];
            return resultado;
        } catch (error) {
            throw new DominioError('Resposta da IA em formato inválido.');
        }
    }
}
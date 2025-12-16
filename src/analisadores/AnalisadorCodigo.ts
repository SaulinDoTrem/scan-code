import { ConectorIA } from "../ia/ConectorIA";
import { ResultadoAnaliseVulnerabilidade } from "./AnalisadorPacote";
import { FormatadorRespostaIA } from "./FormatadorRespostaIA";

export class AnalisadorCodigo {
    constructor(
        private readonly conectorIA: ConectorIA,
        private readonly formatador: FormatadorRespostaIA
    ) {

    }

    async analisar(arquivo: string): Promise<ResultadoAnaliseVulnerabilidade[]> {
        const prompt = this.prepararContextoParaIA(arquivo);
        const respostaBruta = await this.conectorIA.prompt(prompt);
        return this.formatador.tratarResposta(respostaBruta);
    }

    private prepararContextoParaIA(codigo: string): string {
        return `
# Análise estática de vulnerabilidades
\`\`\`typescript


${codigo}


\`\`\`

## Tarefa:
Analise o código acima e identifique:
1. Quais vulnerabilidades de segurança estão presentes no código.
2. Em quais linhas específicas o código vulnerável aparece
3. Qual o risco para este projeto
4. Sugestões de correção

A resposta deve ser estruturada em formato de JSON, seguindo sempre este modelo:
{
    "vulnerabilidades": [
        {
            "vulnerabilidadePresente": true | false,
            "sugestaoCorrecao": "Texto com sugestão de correção",
            "problemaDetectado": "Descrição do problema detectado",
            "impacto": "Descrição do impacto",
            "risco": "Nível de risco (baixo, medio, alto, critico)",
            "codigosVulneraveis": [
                { "inicio": número_da_linha_inicial, "fim": número_da_linha_final }
            ]
        }
    ]
}

A resposta deve sempre seguir esse schema, sem variações ou alucinações.
Caso não identifique nenhum uso da vulnerabilidade no código, responda com "vulnerabilidadePresente": false e deixe os outros campos vazios ou com valores neutros.
Todas as vulnerabilidades devido a pacotes maliciosos/vulneráveis devem ser ignoradas nesta análise.
        `;
    }
}
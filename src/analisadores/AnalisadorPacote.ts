import * as vscode from 'vscode';
import { Pacote } from '../pacotes/Pacote';
import { VulnerabilidadeOSV } from '../osv/VulnerabilidadeOSV';
import { ConectorIA } from '../ia/ConectorIA';
import { FormatadorRespostaIA } from './FormatadorRespostaIA';

export type ResultadosAnaliseIA = {
    errors: Error[];
    resultados: ResultadoAnaliseVulnerabilidade[];
}

export type ResultadoAnaliseVulnerabilidade = {
    vulnerabilidadePresente: boolean;
    sugestaoCorrecao?: string;
    problemaDetectado?: string;
    impacto?: string;
    risco?: RiscoVulnerabilidade;
    codigosVulneraveis?: { inicio: number; fim: number; }[];
};

export enum RiscoVulnerabilidade {
    BAIXO = 'baixo',
    MEDIO = 'medio',
    ALTO = 'alto',
    CRITICO = 'critico'
}

export interface OcorrenciaVulnerabilidade {
    arquivo: vscode.Uri;
    codigoCompleto: string;
    linhasImport: number[];
    pacote: string;
}

export class AnalisadorPacote {
    constructor(
        private readonly conector: ConectorIA,
        private readonly formatador: FormatadorRespostaIA
    ) {}

    private prepararContextoVulnerabilidadeParaIA(vulnerabilidade: VulnerabilidadeOSV, index: number) {
        return `
Vulnerabilidade ${index}
- ID: ${vulnerabilidade.id}
- Resumo: ${vulnerabilidade.summary}
- Detalhes: ${vulnerabilidade.details}
`;
    }

    private prepararContextoPacoteParaIA(pacote: Pacote, index: number) {
        const contextoVulnerabilidades = pacote.vulnerabilidades.map((vuln, idx) => this.prepararContextoVulnerabilidadeParaIA(vuln, idx + 1)).join('\n');

        return `
### Pacote Vulnerável ${index}
- Nome: ${pacote.nome}
- Versão: ${pacote.versao}
- Ecosistema: ${pacote.ecosistema}   

### Vulnerabilidades
${contextoVulnerabilidades}
`;
    }

    /**
     * Prepara o contexto para enviar à IA
     */
    private prepararContextoParaIA(
        nomeArquivo: string,
        pacotes: Pacote[],
        codigoCompleto: string
    ): string {
        const contextoPacote = pacotes.map((pacote, index) => this.prepararContextoPacoteParaIA(pacote, index + 1)).join('\n');
        const contexto = `
# Análise de Vulnerabilidade

## Pacotes Vulneráveis

${contextoPacote}

## Arquivo que utiliza os pacotes
### Arquivo ${nomeArquivo}

\`\`\`typescript
${codigoCompleto}
\`\`\`

## Tarefa
Analise o código acima e identifique:
1. Se a vulnerabilidade está sendo explorada no código
2. Em quais linhas específicas o código vulnerável aparece
3. Qual o risco para este projeto
4. Sugestões de correção

A resposta deve ser estruturada em formato de JSON, seguinto sempre este modelo:
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
`;
        
        return contexto;
    }

    async procurarVulnerabilidadesEmCodigo(arquivo: vscode.Uri, conteudoArquivo: string, pacotesVulneraveis: Pacote[]): Promise<ResultadoAnaliseVulnerabilidade[]> {
        const contexto = this.prepararContextoParaIA(arquivo.fsPath, pacotesVulneraveis, conteudoArquivo);
        const respostaBruta = await this.conector.prompt(contexto);
        return this.formatador.tratarResposta(respostaBruta);
    }
}

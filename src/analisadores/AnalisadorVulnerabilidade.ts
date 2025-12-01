import * as vscode from 'vscode';
import { Pacote } from '../pacotes/Pacote';
import { VulnerabilidadeOSV } from '../osv/VulnerabilidadeOSV';
import { ProcessadorLotes } from '../utils/ProcessadorLotes';
import { DominioError } from '../errors/DominioError';
import { ConectorIA } from '../ia/ConectorIA';

export type ResultadosAnaliseIA = {
    errors: Error[];
    resultados: ResultadoAnaliseVulnerabilidade[];
}

export type OcorrenciaEmCodigo = {
    arquivo: vscode.Uri;
    intervaloVulneravel: { inicio: number; fim: number; }[];
}

export type ResultadoAnaliseVulnerabilidade = {
    vulnerabilidadePresente: boolean;
    sugestaoCorrecao?: string;
    problemaDetectado?: string;
    impacto?: string;
    risco?: RiscoVulnerabilidade;
    linhasVulneraveisPorArquivo?: OcorrenciaEmCodigo[];
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

export class AnalisadorVulnerabilidade {
    constructor(
        private readonly conector: ConectorIA
    ) {}
    /**
     * Busca arquivos que importam pacotes vulneráveis
     */
    async buscarArquivosComPacotesVulneraveis(
        pacotesVulneraveis: Pacote[]
    ): Promise<Map<string, OcorrenciaVulnerabilidade[]>> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return new Map();
        }

        // Buscar todos os arquivos relevantes
        const arquivos = await vscode.workspace.findFiles(
            '**/*.{ts,js,tsx,jsx}',
            '**/node_modules/**'
        );

        // Processar arquivos em lotes
        const ocorrenciasPorPacote = new Map<string, OcorrenciaVulnerabilidade[]>();
        
        const resultados = await ProcessadorLotes.processar(
            arquivos,
            async (uri) => this.analisarArquivo(uri, pacotesVulneraveis),
            15 // 15 arquivos por vez
        );

        // Agrupar por pacote
        for (const resultado of resultados) {
            if (resultado) {
                for (const [pacote, ocorrencia] of Object.entries(resultado)) {
                    if (!ocorrenciasPorPacote.has(pacote)) {
                        ocorrenciasPorPacote.set(pacote, []);
                    }
                    ocorrenciasPorPacote.get(pacote)!.push(ocorrencia);
                }
            }
        }

        return ocorrenciasPorPacote;
    }

    /**
     * Analisa um arquivo específico procurando imports de pacotes vulneráveis
     */
    private async analisarArquivo(
        uri: vscode.Uri,
        pacotesVulneraveis: Pacote[]
    ): Promise<Record<string, OcorrenciaVulnerabilidade> | null> {
        const doc = await vscode.workspace.openTextDocument(uri);
        const text = doc.getText();
        const linhas = text.split('\n');

        const ocorrencias: Record<string, OcorrenciaVulnerabilidade> = {};

        // Verificar cada pacote vulnerável
        for (const pacote of pacotesVulneraveis) {
            const linhasImport = this.encontrarImports(linhas, pacote.nome);
            
            if (linhasImport.length > 0) {
                ocorrencias[pacote.nome] = {
                    arquivo: uri,
                    codigoCompleto: text,
                    linhasImport,
                    pacote: pacote.nome
                };
            }
        }

        return Object.keys(ocorrencias).length > 0 ? ocorrencias : null;
    }

    /**
     * Encontra linhas que fazem import/require do pacote
     */
    private encontrarImports(linhas: string[], nomePacote: string): number[] {
        const linhasEncontradas: number[] = [];
        
        // Regex para diferentes tipos de import
        const patterns = [
            // import ... from 'pacote'
            new RegExp(`import\\s+.*from\\s+['"]${nomePacote}['"]`, 'i'),
            // import 'pacote'
            new RegExp(`import\\s+['"]${nomePacote}['"]`, 'i'),
            // require('pacote')
            new RegExp(`require\\s*\\(\\s*['"]${nomePacote}['"]\\s*\\)`, 'i'),
            // import ... from 'pacote/subpath'
            new RegExp(`import\\s+.*from\\s+['"]${nomePacote}/`, 'i'),
            // require('pacote/subpath')
            new RegExp(`require\\s*\\(\\s*['"]${nomePacote}/`, 'i')
        ];

        linhas.forEach((linha, index) => {
            for (const pattern of patterns) {
                if (pattern.test(linha)) {
                    linhasEncontradas.push(index + 1); // +1 porque linhas começam em 1
                    break;
                }
            }
        });

        return linhasEncontradas;
    }

    /**
     * Prepara o contexto para enviar à IA
     */
    private prepararContextoParaIA(
        pacote: Pacote,
        vulnerabilidade: VulnerabilidadeOSV,
        ocorrencias: OcorrenciaVulnerabilidade[]
    ): string {
        const contexto = `
# Análise de Vulnerabilidade

## Pacote Vulnerável
- Nome: ${pacote.nome}
- Versão: ${pacote.versao}
- Ecosistema: ${pacote.ecosistema}

## Vulnerabilidade
- ID: ${vulnerabilidade.id}
- Resumo: ${vulnerabilidade.summary}
- Detalhes: ${vulnerabilidade.details}

## Arquivos que importam este pacote
${ocorrencias.map((occ, idx) => `
### Arquivo ${idx + 1}: ${occ.arquivo.fsPath}
Linhas com import: ${occ.linhasImport.join(', ')}

\`\`\`typescript
${occ.codigoCompleto}
\`\`\`
`).join('\n')}

## Tarefa
Analise o código acima e identifique:
1. Se a vulnerabilidade está sendo explorada no código
2. Em quais linhas específicas o código vulnerável aparece
3. Qual o risco para este projeto
4. Sugestões de correção

A resposta deve ser estruturada em formato de JSON, seguinto sempre este modelo:
{
    "vulnerabilidadePresente": true | false,
    "sugestaoCorrecao": "Texto com sugestão de correção",
    "problemaDetectado": "Descrição do problema detectado",
    "impacto": "Descrição do impacto",
    "risco": "Nível de risco (baixo, medio, alto, critico)",
    "linhasVulneraveisPorArquivo": [
        {
            "arquivo": "Caminho do arquivo",
            "intervaloVulneravel": [
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

    private tratarResposta(resposta: string): ResultadoAnaliseVulnerabilidade {
        try {
            resposta.includes('```json') && (resposta = resposta.split('```json')[1].split('```')[0]);
            const resultado = JSON.parse(resposta) as ResultadoAnaliseVulnerabilidade;
            resultado.risco = resultado.risco?.toLocaleLowerCase() as RiscoVulnerabilidade;
            return resultado;
        } catch (error) {
            throw new DominioError('Resposta da IA em formato inválido.');
        }
    }

    async procurarVulnerabilidadesEmCodigo(pacotesVulneraveis: Pacote[], ocorrenciasPorPacote: Map<string, OcorrenciaVulnerabilidade[]>): Promise<ResultadosAnaliseIA>  {
        const resultado: ResultadosAnaliseIA = {
            errors: [] as Error[],
            resultados: [] as ResultadoAnaliseVulnerabilidade[]
        };
        
        for (const [nomePacote, ocorrencias] of ocorrenciasPorPacote.entries()) {
            const pacote = pacotesVulneraveis.find(p => p.nome === nomePacote);
            if (!pacote || pacote.vulnerabilidades.length === 0) continue;
            for (const vulnerabilidade of pacote.vulnerabilidades) {
                try {
                    const contexto = this.prepararContextoParaIA(
                        pacote,
                        vulnerabilidade,
                        ocorrencias
                    );
                    const resposta = await this.conector.prompt(contexto);
                    resultado.resultados.push(this.tratarResposta(resposta));
                } catch (error) {
                    resultado.errors.push(error as Error);
                }
            }
        }
        return resultado;
    }
}

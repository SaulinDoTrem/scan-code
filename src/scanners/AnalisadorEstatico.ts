import * as vscode from 'vscode';

export enum TipoVulnerabilidadeEstatica {
    SQL_INJECTION = 'SQL Injection',
    XSS = 'Cross-Site Scripting (XSS)',
    COMMAND_INJECTION = 'Command Injection',
    PATH_TRAVERSAL = 'Path Traversal',
    HARDCODED_CREDENTIALS = 'Credenciais hardcoded',
    WEAK_CRYPTO = 'Criptografia fraca',
    INSECURE_RANDOM = 'Geração de números aleatórios insegura',
    EVAL_USAGE = 'Uso de eval()',
    UNSAFE_REGEX = 'Regex inseguro (ReDoS)',
    OPEN_REDIRECT = 'Open Redirect'
}

export enum SeveridadeVulnerabilidade {
    BAIXA = 'Baixa',
    MEDIA = 'Média',
    ALTA = 'Alta',
    CRITICA = 'Crítica'
}

export type VulnerabilidadeEstatica = {
    tipo: TipoVulnerabilidadeEstatica;
    severidade: SeveridadeVulnerabilidade;
    arquivo: string;
    linha: number;
    coluna: number;
    codigo: string;
    mensagem: string;
    recomendacao: string;
};

export type ResultadoAnaliseScan = {
    vulnerabilidades: VulnerabilidadeEstatica[];
    totalArquivosAnalisados: number;
    tempoAnalise: number;
};

type PadraoVulnerabilidade = {
    tipo: TipoVulnerabilidadeEstatica;
    severidade: SeveridadeVulnerabilidade;
    regex: RegExp;
    mensagem: string;
    recomendacao: string;
};

export class AnalisadorEstatico {
    private padroes: PadraoVulnerabilidade[] = [
        // SQL Injection
        {
            tipo: TipoVulnerabilidadeEstatica.SQL_INJECTION,
            severidade: SeveridadeVulnerabilidade.CRITICA,
            regex: /(?:execute|query|exec)\s*\(\s*["`'].*?\$\{.*?\}.*?["`']|(?:execute|query|exec)\s*\(\s*.*?\+.*?\)/gi,
            mensagem: 'Possível SQL Injection: concatenação de strings em query SQL',
            recomendacao: 'Use prepared statements ou parametrized queries'
        },
        {
            tipo: TipoVulnerabilidadeEstatica.SQL_INJECTION,
            severidade: SeveridadeVulnerabilidade.CRITICA,
            regex: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE).*?(?:\$\{|\+\s*[\w.]+\s*\+)/gi,
            mensagem: 'Query SQL com interpolação de variáveis detectada',
            recomendacao: 'Use ORM ou prepared statements com placeholders'
        },

        // XSS
        {
            tipo: TipoVulnerabilidadeEstatica.XSS,
            severidade: SeveridadeVulnerabilidade.ALTA,
            regex: /\.innerHTML\s*=\s*(?!["'`]).*?[;\n]|dangerouslySetInnerHTML/gi,
            mensagem: 'Possível XSS: uso de innerHTML ou dangerouslySetInnerHTML com dados não sanitizados',
            recomendacao: 'Sanitize entrada do usuário ou use textContent/innerText'
        },
        {
            tipo: TipoVulnerabilidadeEstatica.XSS,
            severidade: SeveridadeVulnerabilidade.ALTA,
            regex: /document\.write\s*\(/gi,
            mensagem: 'Uso de document.write() detectado',
            recomendacao: 'Evite document.write(), use createElement() e métodos DOM seguros'
        },

        // Command Injection
        {
            tipo: TipoVulnerabilidadeEstatica.COMMAND_INJECTION,
            severidade: SeveridadeVulnerabilidade.CRITICA,
            regex: /(?:exec|spawn|execSync|execFile|spawnSync)\s*\(\s*["`'].*?\$\{.*?\}.*?["`']|(?:exec|spawn|execSync|execFile|spawnSync)\s*\(.*?\+/gi,
            mensagem: 'Possível Command Injection: execução de comando com entrada do usuário',
            recomendacao: 'Valide e sanitize todas as entradas, use arrays de argumentos ao invés de strings'
        },

        // Path Traversal
        {
            tipo: TipoVulnerabilidadeEstatica.PATH_TRAVERSAL,
            severidade: SeveridadeVulnerabilidade.ALTA,
            regex: /(?:readFile|writeFile|readFileSync|writeFileSync|createReadStream|createWriteStream)\s*\(\s*(?:["`'].*?\$\{.*?\}.*?["`']|.*?\+.*?)/gi,
            mensagem: 'Possível Path Traversal: operação de arquivo com caminho não validado',
            recomendacao: 'Valide caminhos de arquivo, use path.resolve() e verifique se o caminho está dentro do diretório permitido'
        },

        // Credenciais hardcoded
        {
            tipo: TipoVulnerabilidadeEstatica.HARDCODED_CREDENTIALS,
            severidade: SeveridadeVulnerabilidade.CRITICA,
            regex: /(?:password|passwd|pwd|secret|token|api[-_]?key)\s*[:=]\s*["'`][^"'`\s]{8,}["'`]/gi,
            mensagem: 'Possível credencial ou segredo hardcoded no código',
            recomendacao: 'Use variáveis de ambiente ou serviços de gerenciamento de segredos'
        },

        // Criptografia fraca
        {
            tipo: TipoVulnerabilidadeEstatica.WEAK_CRYPTO,
            severidade: SeveridadeVulnerabilidade.ALTA,
            regex: /(?:createHash|createCipher)\s*\(\s*["'`](?:md5|sha1|des|rc4)["'`]/gi,
            mensagem: 'Algoritmo de criptografia fraco detectado (MD5, SHA1, DES, RC4)',
            recomendacao: 'Use algoritmos modernos como SHA-256, SHA-512, AES-256-GCM'
        },

        // Random inseguro
        {
            tipo: TipoVulnerabilidadeEstatica.INSECURE_RANDOM,
            severidade: SeveridadeVulnerabilidade.MEDIA,
            regex: /Math\.random\s*\(\s*\)/gi,
            mensagem: 'Uso de Math.random() para dados sensíveis',
            recomendacao: 'Para segurança, use crypto.randomBytes() ou crypto.getRandomValues()'
        },

        // Eval
        {
            tipo: TipoVulnerabilidadeEstatica.EVAL_USAGE,
            severidade: SeveridadeVulnerabilidade.CRITICA,
            regex: /\beval\s*\(/gi,
            mensagem: 'Uso de eval() detectado - extremamente perigoso',
            recomendacao: 'Remova eval(), use JSON.parse() ou alternativas seguras'
        },
        {
            tipo: TipoVulnerabilidadeEstatica.EVAL_USAGE,
            severidade: SeveridadeVulnerabilidade.CRITICA,
            regex: /new\s+Function\s*\(/gi,
            mensagem: 'Uso de new Function() detectado',
            recomendacao: 'Evite criar funções dinamicamente, use alternativas seguras'
        },

        // Regex inseguro (ReDoS)
        {
            tipo: TipoVulnerabilidadeEstatica.UNSAFE_REGEX,
            severidade: SeveridadeVulnerabilidade.MEDIA,
            regex: /\/\(.*?\+.*?\)\*\/|\/\(.*?\*.*?\)\+\/|\/\(.*?\+.*?\)\+\//gi,
            mensagem: 'Possível regex inseguro que pode causar ReDoS',
            recomendacao: 'Revise o regex para evitar backtracking excessivo'
        },

        // Open Redirect
        {
            tipo: TipoVulnerabilidadeEstatica.OPEN_REDIRECT,
            severidade: SeveridadeVulnerabilidade.MEDIA,
            regex: /(?:location\.href|location\.replace|window\.location)\s*=\s*(?:["`'].*?\$\{.*?\}.*?["`']|.*?\+.*?)/gi,
            mensagem: 'Possível Open Redirect: redirecionamento com URL não validada',
            recomendacao: 'Valide URLs de redirecionamento contra uma whitelist'
        }
    ];

    async analisar(): Promise<ResultadoAnaliseScan> {
        const inicio = Date.now();
        const vulnerabilidades: VulnerabilidadeEstatica[] = [];

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return {
                vulnerabilidades: [],
                totalArquivosAnalisados: 0,
                tempoAnalise: 0
            };
        }

        // Buscar todos os arquivos relevantes
        const arquivos = await vscode.workspace.findFiles(
            '**/*.{ts,js,tsx,jsx,py,java,cs,php,rb,go}',
            '**/node_modules/**'
        );

        for (const arquivo of arquivos) {
            const vulns = await this.analisarArquivo(arquivo);
            vulnerabilidades.push(...vulns);
        }

        const tempoAnalise = Date.now() - inicio;

        return {
            vulnerabilidades,
            totalArquivosAnalisados: arquivos.length,
            tempoAnalise
        };
    }

    private async analisarArquivo(uri: vscode.Uri): Promise<VulnerabilidadeEstatica[]> {
        const vulnerabilidades: VulnerabilidadeEstatica[] = [];

        try {
            const doc = await vscode.workspace.openTextDocument(uri);
            const texto = doc.getText();
            const linhas = texto.split('\n');

            for (const padrao of this.padroes) {
                let match;
                padrao.regex.lastIndex = 0; // Reset regex

                while ((match = padrao.regex.exec(texto)) !== null) {
                    const posicao = doc.positionAt(match.index);
                    const linha = posicao.line;
                    const coluna = posicao.character;

                    // Pegar o código da linha
                    const codigoLinha = linhas[linha].trim();

                    // Evitar duplicatas na mesma linha
                    const jaTem = vulnerabilidades.some(
                        v => v.arquivo === uri.fsPath && v.linha === linha && v.tipo === padrao.tipo
                    );

                    if (!jaTem) {
                        vulnerabilidades.push({
                            tipo: padrao.tipo,
                            severidade: padrao.severidade,
                            arquivo: vscode.workspace.asRelativePath(uri),
                            linha: linha + 1, // 1-indexed
                            coluna: coluna + 1,
                            codigo: codigoLinha,
                            mensagem: padrao.mensagem,
                            recomendacao: padrao.recomendacao
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao analisar arquivo ${uri.fsPath}:`, error);
        }

        return vulnerabilidades;
    }
}

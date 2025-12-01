export interface RespostaIA {
    vulnerabilidadePresente: boolean;
    linhasVulneraveis: number[];
    nivelRisco: 'baixo' | 'medio' | 'alto' | 'critico';
    explicacao: string;
    sugestoes: string[];
}

export interface ConectorIA {
    prompt(prompt: string): Promise<string>;
    verificarDisponibilidade(): Promise<boolean>;
}

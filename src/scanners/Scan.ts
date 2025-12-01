import { ResultadosAnaliseIA } from "../analisadores/AnalisadorVulnerabilidade";
import { Pacote } from "../pacotes/Pacote";

export class Scan {
    constructor(
        public pacotesVulneraveis: Pacote[],
        public pacotesNaoEncontrados: Pacote[],
        public analise?: ResultadosAnaliseIA
    ) {

    }
}
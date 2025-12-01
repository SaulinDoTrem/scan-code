import { ResultadosAnaliseIA } from "../analisadores/AnalisadorVulnerabilidade";
import { Pacote } from "../pacotes/Pacote";
import { ResultadoAnaliseScan } from "./AnalisadorEstatico";

export class Scan {
    constructor(
        public pacotesVulneraveis: Pacote[],
        public pacotesNaoEncontrados: Pacote[],
        public analise?: ResultadosAnaliseIA,
        public analiseEstatica?: ResultadoAnaliseScan
    ) {

    }
}
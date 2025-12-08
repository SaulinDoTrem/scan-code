import { Pacote } from "../pacotes/Pacote";

export class ScanPacote {
    constructor(
        public pacotesVulneraveis: Pacote[],
        public pacotesNaoEncontrados: Pacote[],
    ) {
    }
}
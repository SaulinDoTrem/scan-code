import { VulnerabilidadeOSV } from "../osv/VulnerabilidadeOSV";
import { PacoteEcosistema } from "./PacoteEcosistema";

export class Pacote {
    constructor(
        public readonly nome: string,
        public readonly versao: string,
        public readonly ecosistema: PacoteEcosistema = PacoteEcosistema.NPM,
        public vulnerabilidades: VulnerabilidadeOSV[] = []
    ) {

    }

    paraJSON(): string {
        const obj = {
            version: this.versao,
            package: {
                name: this.nome,
                ecosystem: this.ecosistema
            }
        };
        return JSON.stringify(obj);
    }
}
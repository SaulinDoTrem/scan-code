import { Pacote } from "../pacotes/Pacote";
import { Vulnerabilidade } from "../pacotes/Vulnerabilidade";
import { VulnerabilidadeOSV } from "./VulnerabilidadeOSV";

export interface Conector {
    consultarPacote(pacote: Pacote): Promise<VulnerabilidadeOSV[]|undefined>;
}
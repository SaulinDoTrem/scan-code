import { Pacote } from "../pacotes/Pacote";
import { VulnerabilidadeOSV } from "./VulnerabilidadeOSV";

export interface Conector {
    consultarPacote(pacote: Pacote): Promise<VulnerabilidadeOSV[]|undefined>;
}
import { DominioError } from "../errors/DominioError";
import { Pacote } from "../pacotes/Pacote";
import { Conector } from "./Conector";
import { RespostaOSV } from "./RespostaOSV";
import { VulnerabilidadeOSV } from "./VulnerabilidadeOSV";

const ROTA = 'https://api.osv.dev/v1/query';

export class OSVConector implements Conector {
    async consultarPacote(pacote: Pacote): Promise<VulnerabilidadeOSV[]|undefined> {
        const resposta = await fetch(ROTA, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: pacote.paraJSON()
        });

        if (!resposta.ok) {
            throw new DominioError('Houve um erro ao tentar consultar a API do OSV DEV.');
        }

        const vulnerabilidades = (await resposta.json()) as RespostaOSV;
        return vulnerabilidades.vulns;
    }
}
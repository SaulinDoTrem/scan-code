import { Scan } from "./Scan";

export interface Scanner {
    scan(): Promise<Scan>;
}
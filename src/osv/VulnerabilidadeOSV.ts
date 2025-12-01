interface Reference {
    type: string;
    url: string;
}

interface Event {
    introduced?: string;
    fixed?: string;
    last_affected?: string;
}

interface Range {
    type: string;
    events: Event[];
}

interface Package {
    name: string;
    ecosystem: string;
    purl: string;
}

interface Affected {
    package: Package;
    ranges: Range[];
    versions?: string[];
    database_specific: {
        source: string;
    };
}

interface DatabaseSpecific {
    github_reviewed?: boolean;
    severity?: string;
    nvd_published_at?: string;
    cwe_ids?: string[];
    github_reviewed_at?: string;
}

interface Severity {
    type: string;
    score: string;
}

export interface VulnerabilidadeOSV {
    id: string;
    summary: string;
    details: string;
    aliases: string[];
    modified: string;
    published: string;
    database_specific: DatabaseSpecific;
    references: Reference[];
    affected: Affected[];
    schema_version: string;
    severity: Severity[];
}
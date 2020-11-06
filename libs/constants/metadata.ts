export const metadata = {
    COLLECTION: "collections",
    FIELD: "fields",
    VIEW: "views",
    DATASOURCE: "datasources",
    SECRET: "secrets",
}

export type Metadata = keyof typeof metadata

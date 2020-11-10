const METADATA = {
	COLLECTION: "collections",
	FIELD: "fields",
	VIEW: "views",
	DATASOURCE: "datasources",
	SECRET: "secrets",
}

type MetadataType = keyof typeof METADATA

export { METADATA, MetadataType }

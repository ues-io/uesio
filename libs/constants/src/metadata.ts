const METADATA = {
	COLLECTION: "collections",
	FIELD: "fields",
	VIEW: "views",
	DATASOURCE: "datasources",
	SECRET: "secrets",
	THEME: "themes",
	SELECTLIST: "selectlists",
	BOT: "bots",
	CREDENTIALS: "credentials",
}

type MetadataType = keyof typeof METADATA

export { METADATA, MetadataType }

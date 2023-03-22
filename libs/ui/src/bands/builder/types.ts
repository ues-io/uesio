const METADATA = {
	COLLECTION: "collections",
	FIELD: "fields",
	VIEW: "views",
	DATASOURCE: "datasources",
	AUTHSOURCE: "authsources",
	FILESOURCE: "filesources",
	SIGNUPMETHOD: "signupmethods",
	SECRET: "secrets",
	THEME: "themes",
	SELECTLIST: "selectlists",
	BOT: "bots",
	CREDENTIALS: "credentials",
	ROUTE: "routes",
	PROFILE: "profiles",
	PERMISSIONSET: "permissionsets",
	COMPONENTVARIANT: "componentvariants",
	COMPONENTPACK: "componentpacks",
	COMPONENT: "components",
	FILE: "files",
	LABEL: "labels",
}

type MetadataType = keyof typeof METADATA
type MetadataKey = `${string}/${string}.${string}`

type MetadataListResponse = {
	metadataType: MetadataType
	namespace: string
	grouping?: string
	metadata: Record<string, boolean>
}

export type { MetadataListResponse, MetadataType, MetadataKey }
export { METADATA }

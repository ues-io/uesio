const METADATA = {
	COLLECTION: "collections",
	FIELD: "fields",
	VIEW: "views",
	DATASOURCE: "datasources",
	AUTHSOURCE: "authsources",
	SECRET: "secrets",
	THEME: "themes",
	SELECTLIST: "selectlists",
	FILECOLLECTION: "filecollections",
	BOT: "bots",
	CREDENTIALS: "credentials",
	ROUTE: "routes",
	PROFILE: "profiles",
	COMPONENTVARIANT: "componentvariants",
	COMPONENTPACK: "componentpacks",
	COMPONENT: "components",
	FILE: "files",
	LABEL: "labels",
}

type MetadataType = keyof typeof METADATA

type BuilderState = {
	activeNode?: string
	selectedNode?: string
	draggingNode?: string
	droppingNode?: string
	lastModifiedNode?: string
}

type MetadataListResponse = {
	metadataType: MetadataType
	namespace: string
	grouping?: string
	metadata: Record<string, boolean>
}

export { BuilderState, MetadataListResponse, MetadataType, METADATA }

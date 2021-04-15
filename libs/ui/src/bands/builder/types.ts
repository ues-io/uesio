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
	ROUTE: "routes",
	PROFILE: "profiles",
}

type MetadataType = keyof typeof METADATA

type MetadataListStore = {
	[key: string]: MetadataListStore | null
} | null

type BuilderState = {
	activeNode?: string
	selectedNode?: string
	draggingNode?: string
	droppingNode?: string
	lastModifiedNode?: string
	metadata: MetadataListStore
	namespaces: MetadataListStore
}

type MetadataListResponse = {
	metadataType: MetadataType
	namespace: string
	grouping?: string
	metadata: MetadataListStore
}

export {
	BuilderState,
	MetadataListStore,
	MetadataListResponse,
	MetadataType,
	METADATA,
}

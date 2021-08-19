const METADATA = {
	COLLECTION: "collections",
	FIELD: "fields",
	VIEW: "views",
	DATASOURCE: "datasources",
	SECRET: "secrets",
	THEME: "themes",
	SELECTLIST: "selectlists",
	FILECOLLECTION: "filecollections",
	BOT: "bots",
	CREDENTIALS: "credentials",
	ROUTE: "routes",
	PROFILE: "profiles",
	COMPONENTVARIANT: "componentvariants",
	FILE: "files",
}

type MetadataType = keyof typeof METADATA

type MetadataListStore = {
	[key: string]: MetadataListStore
} | null

type BuilderState = {
	activeNode?: string
	selectedNode?: string
	draggingNode?: string
	droppingNode?: string
	lastModifiedNode?: string
	metadata: {
		[key: string]: {
			status: string
			data: MetadataListStore
		}
	} | null
	namespaces: {
		status: "PENDING" | "FULFILLED"
		data: MetadataListStore
	} | null
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

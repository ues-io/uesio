const METADATA = {
	COLLECTION: "collection",
	FIELD: "field",
	VIEW: "view",
	DATASOURCE: "datasource",
	SECRET: "secret",
	THEME: "theme",
	SELECTLIST: "selectlist",
	FILECOLLECTION: "filecollection",
	BOT: "bot",
	CREDENTIALS: "credential",
	ROUTE: "route",
	PROFILE: "profile",
	COMPONENTVARIANT: "componentvariant",
	COMPONENTPACK: "componentpack",
	COMPONENT: "components",
	FILE: "file",
	LABEL: "label",
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

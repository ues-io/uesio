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
	COMPONENTPACK: "componentpacks",
	COMPONENT: "components",
	FILE: "files",
	LABEL: "labels",
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
	generatorparams: {
		[key: string]: {
			status: string
			data: BotParam[]
		}
	} | null
}

type MetadataListResponse = {
	metadataType: MetadataType
	namespace: string
	grouping?: string
	metadata: MetadataListStore
}

type BotParam = {
	name: string
	prompt: string
	type?: string
	metadataType?: MetadataType
	grouping?: string
	default?: string
}

export {
	BuilderState,
	MetadataListStore,
	MetadataListResponse,
	MetadataType,
	BotParam,
	METADATA,
}

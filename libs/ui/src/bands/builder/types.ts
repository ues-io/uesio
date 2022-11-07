import { MetadataInfo } from "../../platform/platform"

const METADATA = {
	COLLECTION: "collections",
	FIELD: "fields",
	VIEW: "views",
	DATASOURCE: "datasources",
	AUTHSOURCE: "authsources",
	SIGNUPMETHOD: "signupmethods",
	SECRET: "secrets",
	THEME: "themes",
	SELECTLIST: "selectlists",
	FILECOLLECTION: "filecollections",
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

type BuilderState = {
	activeNode?: string
	selectedNode?: string
	draggingNode?: string
	droppingNode?: string
	lastModifiedNode?: string
	namespaces?: Record<string, MetadataInfo>
}

type MetadataListResponse = {
	metadataType: MetadataType
	namespace: string
	grouping?: string
	metadata: Record<string, boolean>
}

export {
	BuilderState,
	MetadataListResponse,
	MetadataType,
	METADATA,
	MetadataKey,
}

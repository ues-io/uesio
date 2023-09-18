// TODO: We need to load this from the server rather than hard-coding it here too!
const METADATA = {
	COLLECTION: "collections",
	FIELD: "fields",
	VIEW: "views",
	INTEGRATION: "integrations",
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

type Namespace = `${string}/${string}` | ""
// MetadataKey can either be fully qualified (with namespace) or local (just a string)
type MetadataKey = `${Namespace}.${string}` | string

type BundleableBase = {
	namespace: Namespace
	name: string
}

interface Bundleable {
	namespace: Namespace
	name: string
}

type MetadataListResponse = {
	metadataType: MetadataType
	namespace: Namespace
	grouping?: string
	metadata: Record<string, boolean>
}

export type {
	Bundleable,
	BundleableBase,
	MetadataKey,
	MetadataType,
	MetadataListResponse,
	Namespace,
}

export { METADATA }

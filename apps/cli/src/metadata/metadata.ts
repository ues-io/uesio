import { LoadRequestField } from "../wire/loadrequest"
import { App } from "./app"
import { Workspace } from "./workspace"
import { Bundle } from "./bundle"
import { Site } from "./site"
import { SiteDomain } from "./sitedomain"
import { BundleDependency } from "./bundledependency"

interface Metadata {
	getCollectionName(): string
	getFields(): LoadRequestField[]
	list(): Promise<void>
	create(): Promise<void>
}

type MetadataMap = {
	[key: string]: Metadata
}

const metadataMap: MetadataMap = {
	app: App as Metadata,
	workspace: Workspace as Metadata,
	bundle: Bundle as Metadata,
	site: Site as Metadata,
	domain: SiteDomain as Metadata,
	dependency: BundleDependency as Metadata,
}

const metadataMapPlural: MetadataMap = {
	apps: App as Metadata,
	workspaces: Workspace as Metadata,
}

const getMetadataByType = (type: string): Metadata => metadataMap[type]

const getMetadataByTypePlural = (type: string): Metadata =>
	metadataMapPlural[type]

const getMetadataMap = (): MetadataMap => metadataMap

export { Metadata, getMetadataMap, getMetadataByType, getMetadataByTypePlural }

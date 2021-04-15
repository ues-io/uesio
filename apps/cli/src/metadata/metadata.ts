import { App } from "./app"
import { Workspace } from "./workspace"
import { Bundle } from "./bundle"
import { Site } from "./site"
import { SiteDomain } from "./sitedomain"
import { BundleDependency } from "./bundledependency"
import { wire } from "@uesio/ui"

interface Metadata {
	getCollectionName(): string
	getFields(): wire.LoadRequestField[]
	list(): Promise<void>
	create(): Promise<void>
}

type metadataType =
	| "app"
	| "workspace"
	| "bundle"
	| "site"
	| "domain"
	| "dependency"

type metadataTypes = "apps" | "workspaces"

type MetadataMap = {
	[key in metadataType]: Metadata
}

const metadataMap: MetadataMap = {
	app: App,
	workspace: Workspace,
	bundle: Bundle,
	site: Site,
	domain: SiteDomain,
	dependency: BundleDependency,
}

const metadataMapPlural: { [key in metadataTypes]: Metadata } = {
	apps: App,
	workspaces: Workspace,
}

const getMetadataByType = (type: metadataType): Metadata => metadataMap[type]

const getMetadataByTypePlural = (type: metadataTypes): Metadata =>
	metadataMapPlural[type]

const getMetadataMap = (): MetadataMap => metadataMap

export { Metadata, getMetadataMap, getMetadataByType, getMetadataByTypePlural }

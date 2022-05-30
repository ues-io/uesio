import { FunctionComponent } from "react"
import { definition, hooks, component, context } from "@uesio/ui"

type CollectionListDefinition = {
	collectionId: string
	namespace: string
	fieldsWire: string
}

type CollectionDefinition = {
	namespace: string
	isimported: boolean
}

interface CollectionProps extends definition.BaseProps {
	definition: CollectionDefinition
}

interface Props extends definition.BaseProps {
	definition: CollectionListDefinition
}

const Tile = component.registry.getUtility("uesio/io.tile")
const Icon = component.registry.getUtility("uesio/io.icon")

function getComponentContext(
	context: context.Context
): context.WorkspaceState | context.SiteAdminState | undefined {
	const workspace = context.getWorkspace()
	if (workspace) return workspace
	else {
		const siteadmin = context.getSiteAdmin()
		return siteadmin
	}
}

function getPath(
	isimported: boolean,
	context: context.Context,
	collection: string
) {
	const parts = collection.split(".")
	const workspace = context.getWorkspace()
	if (workspace && workspace.app && workspace.name) {
		if (isimported)
			return `/app/${workspace.app}/workspace/${workspace.name}/bundlecollections/${parts[0]}/${parts[1]}`
		return `/app/${workspace.app}/workspace/${workspace.name}/collections/${parts[0]}/${parts[1]}`
	}
	const siteadmin = context.getSiteAdmin()
	if (siteadmin) {
		return `/app/${siteadmin.app}/site/${siteadmin.name}/data/${parts[0]}/${parts[1]}`
	}
}

const Collection: FunctionComponent<CollectionProps> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)

	const collections = uesio.builder.useMetadataList(
		context,
		"COLLECTION",
		definition.namespace
	)

	const collectionKeys = collections && Object.keys(collections)
	if (collectionKeys && collectionKeys.length > 0) {
		return (
			<>
				<h4>{definition.namespace}</h4>
				{Object.keys(collections).map((collection) => (
					<Tile
						key={collection}
						variant="uesio/io.item"
						onClick={(): void => {
							uesio.signal.run(
								{
									signal: "route/REDIRECT",
									path: getPath(
										definition.isimported,
										context,
										collection
									),
								},
								context
							)
						}}
						avatar={<Icon icon={"list"} context={context} />}
						context={context}
					>
						{collection}
					</Tile>
				))}
			</>
		)
	}
	return null
}

const CollectionList: FunctionComponent<Props> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)

	const lcontext = getComponentContext(context)
	const namespaces = uesio.builder.useAvailableNamespaces(context)

	if (namespaces) {
		const keys = Object.keys(namespaces)
		const fromIndex = keys.indexOf(lcontext?.app || "")
		const toIndex = 0
		const element = keys.splice(fromIndex, 1)[0]
		keys.splice(toIndex, 0, element)
		return (
			<>
				{keys.map((namespace) => (
					<Collection
						key={namespace}
						definition={{
							namespace,
							isimported: namespace !== lcontext?.app,
						}}
						context={context}
					/>
				))}
			</>
		)
	}
	return null
}

export default CollectionList

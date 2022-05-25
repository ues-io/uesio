import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import { Context } from "libs/ui/src/context/context"

type CollectionListDefinition = {
	usage: "site" | "workspace"
	appname: string
	sitename?: string
	workspacename?: string
}

type CollectionDefinition = {
	namespace: string
	usage: "site" | "workspace"
	appname: string
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

function pareCollectionKey(key: string) {
	const [owner, collectionKey] = key.split("/")
	const [app, collectionName] = collectionKey.split(".")
	return [owner, app, collectionName]
}

function getPath(
	usage: string,
	isimported: boolean,
	appname: string,
	context: Context,
	collection: string
) {
	const [collectionOwner, collectionApp, collectionName] =
		pareCollectionKey(collection)

	if (usage === "site") {
		return `/app/${appname}/site/${
			context.getSiteAdmin()?.name
		}/data/${collectionOwner}/${collectionApp}/${collectionName}`
	}

	if (isimported) {
		return `/app/${appname}/workspace/${
			context.getWorkspace()?.name
		}/bundlecollections/${collectionOwner}/${collectionApp}/${collectionName}`
	}

	return `/app/${appname}/workspace/${
		context.getWorkspace()?.name
	}/collections/${collectionOwner}/${collectionApp}/${collectionName}`
}

const Collection: FunctionComponent<CollectionProps> = (props) => {
	const { context, definition } = props
	const usage = definition.usage
	const appname = definition.appname
	const isimported = definition.isimported
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
				{collectionKeys.map((collection) => {
					return (
						<Tile
							key={collection}
							variant="uesio/io.item"
							onClick={(): void => {
								uesio.signal.run(
									{
										signal: "route/REDIRECT",
										path: getPath(
											usage,
											isimported,
											appname,
											context,
											collection
										),
									},
									context
								)
							}}
							avatar={
								isimported ? (
									<Icon
										icon={"folder_special"}
										context={context}
									/>
								) : (
									<Icon icon={"list"} context={context} />
								)
							}
							context={context}
						>
							{collection}
						</Tile>
					)
				})}
			</>
		)
	}
	return null
}

const CollectionList: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const usage = definition.usage
	const uesio = hooks.useUesio(props)
	const appname = context.merge(definition.appname)
	const siteName = context.merge(definition.sitename)
	const workspaceName = context.merge(definition.workspacename)

	const newContext =
		usage === "site"
			? props.context.addFrame({
					siteadmin: {
						name: siteName || "",
						app: appname || "",
					},
			  })
			: props.context.addFrame({
					workspace: {
						name: workspaceName || "",
						app: appname || "",
					},
			  })

	const namespaces = uesio.builder.useAvailableNamespaces(newContext)
	if (namespaces) {
		//Force Order
		const keys = Object.keys(namespaces)
		const fromIndex = keys.indexOf(appname || "")
		const toIndex = 0
		const element = keys.splice(fromIndex, 1)[0]
		keys.splice(toIndex, 0, element)

		return (
			<>
				{keys.map((namespace) =>
					usage === "workspace" &&
					namespace === "uesio/core" ? null : (
						<div>
							<Collection
								key={namespace}
								definition={{
									namespace,
									usage,
									appname: appname || "",
									isimported: namespace !== appname,
								}}
								context={newContext}
							/>
						</div>
					)
				)}
			</>
		)
	}
	return null
}

export default CollectionList

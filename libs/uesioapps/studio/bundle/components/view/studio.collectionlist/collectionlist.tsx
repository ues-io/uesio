import { FunctionComponent, useEffect } from "react"
import { definition, styles, wire, hooks, component } from "@uesio/ui"

type CollectionListDefinition = {
	collectionId: string
	namespace: string
	fieldsWire: string
}

type CollectionDefinition = {
	namespace: string
}

interface CollectionProps extends definition.BaseProps {
	definition: CollectionDefinition
}

interface Props extends definition.BaseProps {
	definition: CollectionListDefinition
}

const Tile = component.registry.getUtility("io.tile")
const Icon = component.registry.getUtility("io.icon")

const Collection: FunctionComponent<CollectionProps> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)

	const collections = uesio.builder.useMetadataList(
		context,
		"COLLECTION",
		definition.namespace
	)

	console.log("collections", collections)

	if (collections) {
		return (
			<>
				{Object.keys(collections).map((collection) => (
					<Tile
						variant="io.tile.studio.item"
						onClick={(): void => {
							uesio.signal.run(
								{
									signal: "route/REDIRECT",
									path: `/app/${
										context.getSiteAdmin()?.app
									}/site/${
										context.getSiteAdmin()?.name
									}/data/${collection}`,
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
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const view = context.getView()
	const appName = view?.params?.appname
	const siteName = view?.params?.sitename

	const newContext = props.context.addFrame({
		siteadmin: {
			name: siteName || "",
			app: appName || "",
		},
	})

	const namespaces = uesio.builder.useAvailableNamespaces(newContext)
	console.log(namespaces)
	if (namespaces) {
		return (
			<>
				{Object.keys(namespaces).map((namespace) => (
					<Collection
						definition={{
							namespace: namespace,
						}}
						context={newContext}
					/>
				))}
			</>
		)
	}
	return null
}

export default CollectionList

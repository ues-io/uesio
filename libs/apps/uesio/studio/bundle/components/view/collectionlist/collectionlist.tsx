import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"

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

const Tile = component.registry.getUtility("uesio/io.tile")
const Icon = component.registry.getUtility("uesio/io.icon")

const Collection: FunctionComponent<CollectionProps> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)

	const collections = uesio.builder.useMetadataList(
		context,
		"COLLECTION",
		definition.namespace
	)

	if (collections) {
		return (
			<>
				{Object.keys(collections).map((collection) => (
					<Tile
						key={collection}
						variant="io.tile.io.item"
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
	const { context } = props
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
	if (namespaces) {
		return (
			<>
				{Object.keys(namespaces).map((namespace) => (
					<Collection
						key={namespace}
						definition={{
							namespace,
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

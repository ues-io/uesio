import { FunctionComponent } from "react"
import { definition, hooks, component, styles } from "@uesio/ui"

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
const Grid = component.registry.getUtility("uesio/io.grid")

const Collection: FunctionComponent<CollectionProps> = (props) => {
	const { context, definition } = props
	const namespace = definition.namespace
	const uesio = hooks.useUesio(props)

	const tenant = context.getTenant()
	if (!tenant) throw new Error("Invalid context for collection list")
	const tenantType = context.getTenantType()

	const collections = uesio.builder.useMetadataList(
		//TO-DO dont return stuff that is not public
		context,
		"COLLECTION",
		namespace
	)

	const collectionKeys = collections && Object.keys(collections)
	if (collectionKeys && collectionKeys.length > 0) {
		return (
			<div>
				<h4>{definition.namespace}</h4>
				{Object.keys(collections).map((collection) => (
					<Tile
						key={collection}
						variant="uesio/io.item"
						onClick={() => {
							if (namespace !== tenant.app) return
							const [collectionNS, collectionName] =
								component.path.parseKey(collection)
							uesio.signal.run(
								{
									signal: "route/REDIRECT",
									path: `/app/${tenant.app}/${tenantType}/${tenant.name}/data/${collectionNS}/${collectionName}`,
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
			</div>
		)
	}
	return null
}

const CollectionList: FunctionComponent<Props> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const namespaces = uesio.builder.useAvailableNamespaces(context)

	const gridCols = styles.getResponsiveStyles(
		"gridTemplateColumns",
		{ xs: "1fr 1fr 1fr", md: "1fr 1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr 1fr" },
		context
	)

	if (namespaces) {
		return (
			<Grid
				styles={{
					root: { ...gridCols, columnGap: "10px" },
				}}
				context={context}
			>
				{Object.keys(namespaces).map((namespace) => (
					<Collection
						key={namespace}
						definition={{
							namespace,
						}}
						context={context}
					/>
				))}
			</Grid>
		)
	}
	return null
}

export default CollectionList

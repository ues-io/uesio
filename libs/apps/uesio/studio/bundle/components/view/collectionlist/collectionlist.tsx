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

const Tile = component.getUtility("uesio/io.tile")
const Icon = component.getUtility("uesio/io.icon")
const Grid = component.getUtility("uesio/io.grid")

const Collection: FunctionComponent<CollectionProps> = (props) => {
	const { context, definition } = props
	const namespace = definition.namespace
	const uesio = hooks.useUesio(props)

	const tenant = context.getTenant()
	if (!tenant) throw new Error("Invalid context for collection list")
	const tenantType = context.getTenantType()

	const collections = uesio.builder.useMetadataList(
		context,
		"COLLECTION",
		namespace
	)

	const isLocalNamespace = tenant.app === namespace
	const collectionKeys = collections && Object.keys(collections)
	if (collectionKeys && collectionKeys.length > 0) {
		return (
			<div
				style={{
					...(isLocalNamespace
						? {
								gridColumnEnd: 3,
								gridColumnStart: 1,
								paddingBottom: "1em",
								borderBottom: "1px solid #eee",
								display: "flex",
								flexFlow: "row wrap",
								gap: "10px",
						  }
						: {
								pointerEvents: "none",
						  }),
				}}
			>
				<h4 style={{ flex: "100%" }}>{definition.namespace}</h4>

				{Object.keys(collections).map((collection) => (
					<Tile
						key={collection}
						variant="uesio/io.item"
						onClick={() => {
							if (isLocalNamespace) return
							const [collectionNS, collectionName] =
								component.path.parseKey(collection)
							uesio.signal.run(
								{
									signal: "route/REDIRECT",
									path: `/app/${tenant.app}/${tenantType}/${
										tenant.name
									}/${
										tenantType === "site"
											? "data"
											: "collections"
									}/${collectionNS}/${collectionName}`,
								},
								context
							)
						}}
						avatar={<Icon icon={"list"} context={context} />}
						context={context}
					>
						{collection.replace(definition.namespace + ".", "")}
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
	const namespaces = Object.keys(
		uesio.builder.useAvailableNamespaces(context) || {}
	)
	const tenant = context.getTenant()?.app

	const orderedNamespaces = tenant
		? [tenant, ...namespaces.filter((el) => el !== tenant)]
		: namespaces

	if (!namespaces) return null
	return (
		<Grid
			styles={{
				root: {
					gridTemplateColumns: "repeat(1fr, minmax(1fr, 1fr))",
					columnGap: "10px",
				},
			}}
			context={context}
		>
			{orderedNamespaces.map((namespace) => (
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

export default CollectionList

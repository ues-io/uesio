import { FunctionComponent, useEffect } from "react"
import { definition, styles, wire, hooks, component, context } from "@uesio/ui"

type DataManagerDefinition = {
	collectionId: string
	namespace: string
	usage: "site" | "workspace"
}

interface Props extends definition.BaseProps {
	definition: DataManagerDefinition
}

const init = (
	usage: string,
	collectionMrg: string,
	namespaceMrg: string,
	context: context.Context
): [string, string, context.Context] => {
	if (usage === "site") {
		const view = context.getView()
		const appName = view?.params?.appname
		const siteName = view?.params?.sitename
		const [namespace, name] = component.path.parseKey(collectionMrg)
		return [
			namespace,
			collectionMrg,
			context.addFrame({
				siteadmin: {
					name: siteName || "",
					app: appName || "",
				},
			}),
		]
	}
	return [namespaceMrg, `${namespaceMrg}.${collectionMrg}`, context]
}

const DataManager: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionMrg = context.merge(definition.collectionId)
	const namespaceMrg = context.merge(definition.namespace)
	const usage = definition.usage

	const [namespace, collection, newContext] = init(
		usage,
		collectionMrg,
		namespaceMrg,
		context
	)

	const fieldsMeta = uesio.builder.useMetadataList(
		newContext,
		"FIELD",
		namespace,
		collection
	)

	// Get Field info
	useEffect(() => {
		// Create on-the-fly wire
		if (!fieldsMeta) return
		const fields: wire.WireFieldDefinitionMap = {}
		Object.keys(fieldsMeta).forEach((record) => {
			fields[`${record}`] = null
		})
		const basePath = `["viewdef"]["${newContext.getViewDefId()}"]["wires"]`
		uesio.builder.addDefinitionPair(
			basePath,
			{
				collection,
				fields,
			},
			"collectionData"
		)

		uesio.wire.loadWires(newContext, ["collectionData"])

		return () => {
			uesio.builder.removeDefinition(`${basePath}["collectionData"]`)
		}
	}, [fieldsMeta])

	if (!fieldsMeta) return null

	return (
		<component.Component
			componentType="io.table"
			definition={{
				id: "collectionDataTable",
				wire: "collectionData",
				mode: "EDIT",
				rownumbers: true,
				rowactions: [
					{
						text: "Delete",
						signals: [
							{
								signal: "wire/TOGGLE_DELETE_STATUS",
							},
						],
					},
				],
				columns: Object.keys(fieldsMeta).map((record) => ({
					["io.column"]: {
						field: `${record}`,
					},
				})),
			}}
			path={props.path}
			context={newContext}
		/>
	)
}

export default DataManager

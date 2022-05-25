import { FunctionComponent } from "react"
import { definition, hooks, component, context } from "@uesio/ui"

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
		const appName = view?.params?.app
		const siteName = view?.params?.sitename
		const [namespace] = component.path.parseKey(collectionMrg)
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

const WIRE_NAME = "collectionData"

const getWireDefinition = (collection: string, fields: string[] | null) => {
	if (!fields || !collection) return null
	return {
		collection,
		fields: Object.fromEntries(fields.map((field) => [field, null])),
	}
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

	const wireDef = getWireDefinition(
		collection,
		fieldsMeta && Object.keys(fieldsMeta)
	)

	const dataWire = uesio.wire.useDynamicWire(WIRE_NAME, wireDef, true)

	if (!dataWire || !fieldsMeta) return null

	return (
		<component.Component
			componentType="uesio/io.table"
			definition={{
				id: "collectionDataTable",
				wire: WIRE_NAME,
				mode: "EDIT",
				rownumbers: true,
				pagesize: 10,
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
					["uesio/io.column"]: {
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

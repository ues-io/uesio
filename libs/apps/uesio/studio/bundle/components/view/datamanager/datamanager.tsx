import { FunctionComponent, useEffect } from "react"
import { definition, wire, hooks, component, context } from "@uesio/ui"

type DataManagerDefinition = {
	collectionId: string // uesio/crm.account
	app: string // uesio/crm
	usage: "site" | "workspace"
	siteName?: string // uesio/studio
}

interface Props extends definition.BaseProps {
	definition: DataManagerDefinition
}

const init = (
	usage: string,
	siteName: string,
	appName: string,
	context: context.Context
): context.Context => {
	if (usage === "site") {
		return context.addFrame({
			siteadmin: {
				name: siteName || "",
				app: appName || "",
			},
		})
	}

	return context
}

const WIRE_NAME = "collectionData"

const DataManager: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collection = context.merge(definition.collectionId)
	const siteName = context.merge(definition?.siteName)
	const app = context.merge(definition.app)
	const usage = definition.usage

	const newContext = init(usage, siteName, app, context)
	const fieldsMeta = uesio.builder.useMetadataList(
		newContext,
		"FIELD",
		app,
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

		uesio.wire.initWires(newContext, {
			[WIRE_NAME]: { collection, fields },
		})
		uesio.wire.loadWires(newContext, [WIRE_NAME])
	}, [fieldsMeta])

	if (!fieldsMeta) return null

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

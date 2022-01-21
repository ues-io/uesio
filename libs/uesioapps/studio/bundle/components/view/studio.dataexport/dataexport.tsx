import { FunctionComponent, useEffect } from "react"
import { definition, styles, wire, hooks, component, context } from "@uesio/ui"

type DataExportDefinition = {
	collectionId: string
	namespace: string
	usage: "site" | "workspace"
}

interface Props extends definition.BaseProps {
	definition: DataExportDefinition
}

const init = (
	usage: string,
	collectionMrg: string,
	namespaceMrg: string,
	context: context.Context
): [string, string, context.Context] => {
	const view = context.getView()
	const appName = view?.params?.appname
	const siteName = view?.params?.sitename
	const workspaceName = view?.params?.workspacename
	if (usage === "site") {
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
	return [
		namespaceMrg,
		`${namespaceMrg}.${collectionMrg}`,
		context.addFrame({
			workspace: {
				name: workspaceName || "",
				app: appName || "",
			},
		}),
	]
}

const Button = component.registry.getUtility("io.button")

const DataExport: FunctionComponent<Props> = (props) => {
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

	const wire = uesio.wire.useWire("collectionData")

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

		uesio.wire.initWires(newContext, ["collectionData"])
		uesio.wire.loadWires(newContext, ["collectionData"])

		return () => {
			uesio.builder.removeDefinition(`${basePath}["collectionData"]`)
		}
	}, [fieldsMeta])

	if (!fieldsMeta) return null

	const data = wire?.getData()

	return (
		<Button
			onClick={() => {
				data?.map((record, i) =>
					console.log(
						record.getFieldValue("crm.name"),
						record.getFieldValue("uesio.id")
					)
				)
			}}
			context={newContext}
			label={"Export Data"}
			variant={"io.secondary"}
		/>
	)
}

export default DataExport

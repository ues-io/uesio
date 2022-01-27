import { FunctionComponent } from "react"
import { definition, hooks, context, component } from "@uesio/ui"

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
): [string, context.Context] => {
	const view = context.getView()
	const appName = view?.params?.appname
	const siteName = view?.params?.sitename
	const workspaceName = view?.params?.workspacename
	if (usage === "site") {
		return [
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
		`${namespaceMrg}.${collectionMrg}`,
		!appName || !workspaceName
			? context
			: context.addFrame({
					workspace: {
						name: workspaceName,
						app: appName,
					},
			  }),
	]
}

const Button = component.registry.getUtility("io.button")

const DataExport: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionMrg = context.merge(definition?.collectionId)
	const namespaceMrg = context.merge(definition?.namespace)
	const usage = definition?.usage

	const [collectionId, newContext] = init(
		usage,
		collectionMrg,
		namespaceMrg,
		context
	)

	const collection = uesio.collection.useCollection(newContext, collectionId)
	if (!collection) return null

	const spec: definition.ImportSpec = {
		jobtype: "export",
		collection: collection.getFullName(),
		upsertkey: "",
		filetype: "csv",
		mappings: {},
	}

	const triggerExport = async () => {
		const jobResponse = await uesio.collection.createImportJob(
			newContext,
			spec
		)

		if (!jobResponse.id) return

		console.log(jobResponse.id)

		const batchResponse = await uesio.collection.exportData(
			newContext,
			jobResponse.id
		)

		if (batchResponse.status !== 200) {
			const error = await batchResponse.text()
			uesio.notification.addError("Import error: " + error, newContext)
			return
		}
	}

	return (
		<Button
			context={newContext}
			variant={"io.secondary"}
			onClick={triggerExport}
			label={"DATA EXPORT TEST"}
		/>
	)
}

export default DataExport

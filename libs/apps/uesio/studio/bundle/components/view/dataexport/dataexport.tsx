import { FunctionComponent } from "react"
import { definition, hooks, context, component } from "@uesio/ui"

type DataExportDefinition = {
	collectionId: string
	namespace: string
	usage: "site" | "workspace"
	wireName: string
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
	const appName = view?.params?.app
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

const Button = component.registry.getUtility("uesio/io.button")

const DataExport: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionMrg = context.merge(definition?.collectionId)
	const namespaceMrg = context.merge(definition?.namespace)
	const usage = definition?.usage
	const wireName = definition?.wireName

	const [collectionId, newContext] = init(
		usage,
		collectionMrg,
		namespaceMrg,
		context
	)

	const collection = uesio.collection.useCollection(newContext, collectionId)
	if (!collection) return null

	const spec: definition.ExportSpec = {
		jobtype: "EXPORT",
		collection: collection.getFullName(),
		filetype: "CSV",
	}

	const triggerExport = async () => {
		const jobResponse = await uesio.collection.createJob(newContext, spec)

		if (!jobResponse.id) {
			uesio.notification.addError(
				"Something went wrong unable to create the job",
				newContext
			)
			return
		}

		uesio.signal.run(
			{
				signal: "wire/LOAD",
				wires: [wireName],
			},
			newContext
		)
	}

	return (
		<Button
			context={newContext}
			variant={"uesio/io.primary"}
			onClick={triggerExport}
			label={"EXPORT " + definition?.collectionId}
		/>
	)
}

export default DataExport

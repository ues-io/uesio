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
	if (usage === "site") {
		const view = context.getView()
		const appName = view?.params?.appname
		const siteName = view?.params?.sitename
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
	return [`${namespaceMrg}.${collectionMrg}`, context]
}

const Button = component.registry.getUtility("io.button")

const DataExport: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	//const collectionMrg = context.merge(definition.collectionId)
	//const namespaceMrg = context.merge(definition.namespace)
	const usage = definition.usage
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname
	const newContext =
		!appName || !workspaceName
			? props.context
			: context.addFrame({
					workspace: {
						name: workspaceName,
						app: appName,
					},
			  })

	const changeUploaded = async () => {
		const file = new File(["foo"], "foo.txt", {
			type: "text/plain",
		})

		const batchResponse = await uesio.collection.importData(
			newContext,
			file,
			"621e5f0c-14de-4905-b9d0-63ceba17b7b1"
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
			onClick={changeUploaded}
			label={"DATA EXPORT TEST"}
		/>
	)
}

export default DataExport

import { FunctionComponent, useState } from "react"
import { definition, hooks, context } from "@uesio/ui"

import ImportBody from "./importbody"
import ImportButton from "./importbutton"

type DataImportDefinition = {
	collectionId: string
	namespace: string
	usage: "site" | "workspace"
}

interface Props extends definition.BaseProps {
	definition: DataImportDefinition
}

const init = (
	usage: string,
	collectionMrg: string,
	namespaceMrg: string,
	context: context.Context
): [string, context.Context] => {
	if (usage === "site") {
		const view = context.getView()
		const appName = view?.params?.app
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

interface State {
	success: boolean
	csvFields: string[]
	file: File | null
}

const DataImport: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionMrg = context.merge(definition.collectionId)
	const namespaceMrg = context.merge(definition.namespace)
	const usage = definition.usage

	const [collectionId, newContext] = init(
		usage,
		collectionMrg,
		namespaceMrg,
		context
	)

	const [uploaded, setUploaded] = useState<State>({
		success: false,
		csvFields: [],
		file: null,
	})

	const changeUploaded = (
		success: boolean,
		csvFields: string[],
		file: File
	): void => {
		setUploaded({ success, csvFields, file })
	}

	const collection = uesio.collection.useCollection(newContext, collectionId)
	if (!collection) return null

	return !uploaded.success ? (
		<ImportButton changeUploaded={changeUploaded} context={newContext} />
	) : (
		<ImportBody
			definition={{
				collectionId: "",
				namespace: "",
				usage: "site",
			}}
			usage={usage}
			collection={collection}
			csvFields={uploaded.csvFields}
			file={uploaded.file}
			context={newContext}
		/>
	)
}

export default DataImport

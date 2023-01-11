import { FunctionComponent } from "react"
import { definition, api, component } from "@uesio/ui"

type DataExportDefinition = {
	collectionId: string
	namespace: string
	wireName: string
}

interface Props extends definition.BaseProps {
	definition: DataExportDefinition
}

const DataExport: FunctionComponent<Props> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const { context, definition } = props

	const collectionId = context.mergeString(definition?.collectionId)

	const wireName = definition?.wireName

	const collection = api.collection.useCollection(context, collectionId)
	if (!collection) return null

	const spec: definition.ExportSpec = {
		jobtype: "EXPORT",
		collection: collection.getFullName(),
		filetype: "CSV",
	}

	const triggerExport = async () => {
		const jobResponse = await api.collection.createJob(context, spec)

		if (!jobResponse.id) {
			api.notification.addError(
				"Something went wrong unable to create the job",
				context
			)
			return
		}

		api.signal.run(
			{
				signal: "wire/LOAD",
				wires: [wireName],
			},
			context
		)
	}

	return (
		<Button
			context={context}
			variant={"uesio/io.primary"}
			onClick={triggerExport}
			label={"EXPORT " + definition?.collectionId}
		/>
	)
}

export default DataExport

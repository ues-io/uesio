import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"

type DataExportDefinition = {
	collectionId: string
	namespace: string
	wireName: string
}

interface Props extends definition.BaseProps {
	definition: DataExportDefinition
}

const Button = component.getUtility("uesio/io.button")

const DataExport: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionId = context.mergeString(definition?.collectionId)

	const wireName = definition?.wireName

	const collection = uesio.collection.useCollection(context, collectionId)
	if (!collection) return null

	const spec: definition.ExportSpec = {
		jobtype: "EXPORT",
		collection: collection.getFullName(),
		filetype: "CSV",
	}

	const triggerExport = async () => {
		const jobResponse = await uesio.collection.createJob(context, spec)

		if (!jobResponse.id) {
			uesio.notification.addError(
				"Something went wrong unable to create the job",
				context
			)
			return
		}

		uesio.signal.run(
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

import { FunctionComponent, useState } from "react"
import { definition, hooks } from "@uesio/ui"

import ImportBody from "./importbody"
import ImportButton from "./importbutton"

type DataImportDefinition = {
	collectionId: string
	namespace: string
}

interface Props extends definition.BaseProps {
	definition: DataImportDefinition
}

interface State {
	success: boolean
	csvFields: string[]
	file: File | null
}

const DataImport: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionId = context.merge(definition.collectionId)

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

	const collection = uesio.collection.useCollection(context, collectionId)
	if (!collection) return null

	return !uploaded.success ? (
		<ImportButton changeUploaded={changeUploaded} context={context} />
	) : (
		<ImportBody
			definition={{
				collectionId: "",
				namespace: "",
			}}
			collection={collection}
			csvFields={uploaded.csvFields}
			file={uploaded.file}
			context={context}
		/>
	)
}

export default DataImport

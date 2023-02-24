import { definition, metadata } from "@uesio/ui"
import { getBuilderNamespace } from "../../api/stateapi"
import NamespaceLabel from "../../utilities/namespacelabel/namespacelabel"

const WireTag: definition.UC = (props) => {
	const { context } = props
	const record = context.getRecord()

	if (!record) return null

	const wireId = record.getFieldValue("key") as string
	const collection = record.getFieldValue("value->collection") as string

	const nsInfo = getBuilderNamespace(
		context,
		collection as metadata.MetadataKey
	)

	return (
		<div className="tagroot">
			{wireId}
			<NamespaceLabel
				metadatainfo={nsInfo}
				context={context}
				metadatakey={collection}
			/>
		</div>
	)
}

export default WireTag

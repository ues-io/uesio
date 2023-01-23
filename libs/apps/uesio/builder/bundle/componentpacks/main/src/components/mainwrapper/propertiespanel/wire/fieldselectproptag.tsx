import { definition, api, metadata } from "@uesio/ui"
import { remove, set } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"

import { getBuilderNamespace } from "../../../../api/stateapi"
import NamespaceLabel from "../../../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"

type Props = {
	collectionKey: string
	fieldId: string
	path: FullPath
	selected: boolean
}
const FieldSelectPropTag: definition.UtilityComponent<Props> = (props) => {
	const { fieldId, collectionKey, context, path, selected } = props

	const collectionMetadata = api.collection.useCollection(
		context,
		collectionKey
	)
	if (!collectionMetadata) return null
	const fieldMetadata = collectionMetadata.getField(fieldId)
	if (!fieldMetadata) return null

	const nsInfo = getBuilderNamespace(context, fieldId as metadata.MetadataKey)

	return (
		<PropNodeTag
			key={fieldId}
			selected={selected}
			context={context}
			onClick={(e: MouseEvent) => {
				e.stopPropagation()
				selected ? remove(context, path) : set(context, path, {})
			}}
		>
			<div className="tagroot">
				<NamespaceLabel
					context={context}
					metadatainfo={nsInfo}
					metadatakey={fieldId}
					title={fieldMetadata.getLabel()}
				/>
				<div>
					<span className="infotag">{fieldMetadata.getType()}</span>
				</div>
			</div>
		</PropNodeTag>
	)
}

export default FieldSelectPropTag

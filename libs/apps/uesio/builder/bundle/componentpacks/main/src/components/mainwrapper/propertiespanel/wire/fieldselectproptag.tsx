import { definition, metadata, collection } from "@uesio/ui"
import { remove, set } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"

import { getBuilderNamespace } from "../../../../api/stateapi"
import ActionButton from "../../../../helpers/actionbutton"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import NamespaceLabel from "../../../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"

type Props = {
	setReferencePath: (path: FullPath) => void
	fieldMetadata: collection.Field
	path: FullPath
	selected: boolean
}
const FieldSelectPropTag: definition.UtilityComponent<Props> = (props) => {
	const { fieldMetadata, context, path, selected, setReferencePath } = props
	const fieldId = fieldMetadata.getId()

	const referenceMetadata =
		fieldMetadata.isReference() && fieldMetadata.getReferenceMetadata()

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

				<span className="infotag">{fieldMetadata.getType()}</span>
			</div>
			{referenceMetadata && (
				<BuildActionsArea context={context}>
					<ActionButton
						title="Add Reference Fields"
						icon={"arrow_forward"}
						onClick={(e) => {
							e.stopPropagation()
							setReferencePath(path.addLocal("fields"))
						}}
						context={context}
					/>
				</BuildActionsArea>
			)}
		</PropNodeTag>
	)
}

export default FieldSelectPropTag

import { definition, metadata, collection, component, context } from "@uesio/ui"
import { FullPath } from "../../../../api/path"

import { getBuilderNamespace } from "../../../../api/stateapi"
import ActionButton from "../../../../helpers/actionbutton"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import NamespaceLabel from "../../../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"
import ItemTag from "../../../../utilities/itemtag/itemtag"

type Props = {
	setReferencePath: (path: FullPath) => void
	onSelect?: (ctx: context.Context, path: FullPath) => void
	onUnselect?: (ctx: context.Context, path: FullPath) => void
	fieldMetadata: collection.Field
	path: FullPath
	selected: boolean
}
const FieldSelectPropTag: definition.UtilityComponent<Props> = (props) => {
	const Text = component.getUtility("uesio/io.text")
	const {
		fieldMetadata,
		context,
		onSelect,
		onUnselect,
		path,
		selected,
		setReferencePath,
	} = props
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
				selected
					? onUnselect?.(context, path)
					: onSelect?.(context, path)
			}}
		>
			<ItemTag context={context}>
				<NamespaceLabel
					context={context}
					metadatainfo={nsInfo}
					metadatakey={fieldId}
					title={fieldMetadata.getLabel()}
				/>

				<Text
					variant="uesio/builder.infobadge"
					text={fieldMetadata.getType()}
					context={context}
				/>
			</ItemTag>
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

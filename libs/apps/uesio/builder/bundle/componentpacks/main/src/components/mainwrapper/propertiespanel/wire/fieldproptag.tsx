import { component, definition, wire, api, metadata } from "@uesio/ui"

import { FC, useState } from "react"
import DeleteAction from "../../../../actions/deleteaction"
import MoveActions from "../../../../actions/moveactions"
import { FullPath } from "../../../../api/path"
import { getBuilderNamespace, setSelectedPath } from "../../../../api/stateapi"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import NamespaceLabel from "../../../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"

interface T extends definition.UtilityProps {
	collectionKey: string
	fieldId: string
	fieldDef: wire.WireFieldDefinition
	path: FullPath
	selectedPath: FullPath
}
const FieldPropTag: FC<T> = (props) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const { fieldId, fieldDef, collectionKey, context, path, selectedPath } =
		props

	const [expanded, setExpanded] = useState<boolean>(false)
	const collectionMetadata = api.collection.useCollection(
		context,
		collectionKey
	)
	if (!collectionMetadata) return null
	const fieldMetadata = collectionMetadata.getField(fieldId)
	if (!fieldMetadata) return null

	const selected = path.equals(selectedPath)
	const hasSelectedChild = selectedPath.startsWith(path)
	const subFields = Object.keys(fieldDef?.fields || {})

	const nsInfo = getBuilderNamespace(context, fieldId as metadata.MetadataKey)

	return (
		<PropNodeTag
			draggable={`${collectionKey}:${fieldId}`}
			key={fieldId}
			selected={selected || hasSelectedChild}
			context={context}
			onClick={(e: MouseEvent) => {
				setSelectedPath(context, path)
				e.stopPropagation()
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
					{subFields && subFields.length > 0 && (
						<span
							onClick={(e) => {
								setExpanded(!expanded)
								e.stopPropagation()
							}}
							className="infotag"
						>
							{subFields.length}
						</span>
					)}
					<span className="infotag">{fieldMetadata.getType()}</span>
				</div>
			</div>
			{subFields && subFields.length > 0 && (
				<IOExpandPanel
					context={context}
					expanded={expanded || hasSelectedChild}
				>
					<div className="subarea">
						{subFields.map((fieldId) => {
							const subFieldsPath = path.addLocal("fields")
							const referenceMetadata =
								fieldMetadata.getReferenceMetadata()
							if (!referenceMetadata) return null
							return (
								<FieldPropTag
									variant="uesio/builder.subpropnodetag"
									collectionKey={referenceMetadata.collection}
									fieldId={fieldId}
									path={subFieldsPath.addLocal(fieldId)}
									selectedPath={selectedPath}
									fieldDef={fieldDef?.fields[fieldId]}
									context={context}
									key={fieldId}
								/>
							)
						})}
					</div>
				</IOExpandPanel>
			)}
			<IOExpandPanel context={context} expanded={selected}>
				<BuildActionsArea context={context}>
					<DeleteAction context={context} path={path} />
					<MoveActions context={context} path={path} />
				</BuildActionsArea>
			</IOExpandPanel>
		</PropNodeTag>
	)
}

export default FieldPropTag

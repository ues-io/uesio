import { component, definition, wire, api, metadata } from "@uesio/ui"

import { FC, useState } from "react"
import BuildActionsArea from "../../helpers/buildactionsarea"
import NamespaceLabel from "../namespacelabel/namespacelabel"
import PropNodeTag from "../propnodetag/propnodetag"

interface T extends definition.UtilityProps {
	collectionKey: string
	fieldId: string
	path: string
	fieldDef: wire.WireFieldDefinition
	variant?: metadata.MetadataKey
}
const FieldPropTag: FC<T> = (props) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const {
		fieldId,
		fieldDef,
		collectionKey,
		context,
		variant,
		path = "",
	} = props

	const [expanded, setExpanded] = useState<boolean>(false)
	const collectionMetadata = api.collection.useCollection(
		context,
		collectionKey
	)
	if (!collectionMetadata) return null
	const fieldMetadata = collectionMetadata.getField(fieldId)
	if (!fieldMetadata) return null

	const selected = false // valueAPI.isSelected(path)
	const hasSelectedChild = false // valueAPI.hasSelectedChild(path)
	const subFields = Object.keys(fieldDef?.fields || {})

	return (
		<PropNodeTag
			variant={variant}
			draggable={`${collectionKey}:${fieldId}`}
			key={fieldId}
			selected={selected || hasSelectedChild}
			context={context}
			onClick={(e: MouseEvent) => {
				//valueAPI.select(path)
				e.stopPropagation()
			}}
		>
			<div className="tagroot">
				<NamespaceLabel
					context={context}
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
							const referenceMetadata =
								fieldMetadata.getReferenceMetadata()
							if (!referenceMetadata) return null
							return (
								<FieldPropTag
									variant="uesio/builder.subpropnodetag"
									collectionKey={referenceMetadata.collection}
									fieldId={fieldId}
									fieldDef={fieldDef?.fields[fieldId]}
									context={context}
									key={fieldId}
									path={`${path}["fields"]["${fieldId}"]`}
								/>
							)
						})}
					</div>
				</IOExpandPanel>
			)}
			<IOExpandPanel context={context} expanded={selected}>
				<BuildActionsArea
					context={context}
					// path={path}
					// valueAPI={valueAPI}
					// actions={[
					// 	{
					// 		type: "MOVE",
					// 	},
					// 	{
					// 		type: "DELETE",
					// 	},
					// ]}
				/>
			</IOExpandPanel>
		</PropNodeTag>
	)
}

export default FieldPropTag

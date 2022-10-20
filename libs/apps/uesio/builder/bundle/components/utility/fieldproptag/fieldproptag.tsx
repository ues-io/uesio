import {
	builder,
	component,
	definition,
	wire,
	hooks,
	metadata,
} from "@uesio/ui"

const PropNodeTag = component.getUtility("uesio/builder.propnodetag")
const NamespaceLabel = component.getUtility("uesio/builder.namespacelabel")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

import { FC, useState } from "react"
import BuildActionsArea from "../../shared/buildproparea/buildactionsarea"

interface T extends definition.UtilityProps {
	collectionKey: string
	fieldId: string
	fieldDef: wire.WireFieldDefinition
	valueAPI: builder.ValueAPI
	variant?: metadata.MetadataKey
}
const FieldPropTag: FC<T> = (props) => {
	const {
		fieldId,
		fieldDef,
		collectionKey,
		context,
		valueAPI,
		variant,
		path = "",
	} = props
	const uesio = hooks.useUesio(props)
	const [expanded, setExpanded] = useState<boolean>(false)
	const collectionMetadata = uesio.collection.useCollection(
		context,
		collectionKey
	)
	if (!collectionMetadata) return null
	const fieldMetadata = collectionMetadata.getField(fieldId)
	if (!fieldMetadata) return null

	const selected = valueAPI.isSelected(path)
	const hasSelectedChild = valueAPI.hasSelectedChild(path)
	const subFields = Object.keys(fieldDef?.fields || {})

	return (
		<PropNodeTag
			variant={variant}
			draggable={`${collectionKey}:${fieldId}`}
			key={fieldId}
			selected={selected || hasSelectedChild}
			context={context}
			onClick={(e: MouseEvent) => {
				valueAPI.select(path)
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
									valueAPI={valueAPI}
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
					path={path}
					valueAPI={valueAPI}
					actions={[
						{
							type: "MOVE",
						},
						{
							type: "DELETE",
						},
					]}
				/>
			</IOExpandPanel>
		</PropNodeTag>
	)
}

export default FieldPropTag

import { component, definition, api, metadata, wire } from "@uesio/ui"

type ParamsFieldDefinition = {
	fieldId: string
	label?: string
	labelPosition?: string
	wrapperVariant?: metadata.MetadataKey
	textVariant?: metadata.MetadataKey
}

const ParamsField: definition.UC<ParamsFieldDefinition> = (props) => {
	const MapField = component.getUtility("uesio/io.mapfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const {
		context,
		definition: { fieldId, wrapperVariant, labelPosition, label },
	} = props

	const record = context.getRecord()

	if (!record) return null

	const view = record.getFieldValue<string>("view")

	if (!view) return null

	const paramsDef = api.view.useViewDef(view)?.params as Record<
		string,
		Record<"type", string>
	>

	if (!paramsDef) return null

	const params = record.getFieldValue(fieldId)

	return (
		<FieldWrapper
			label={label}
			labelPosition={labelPosition}
			context={context}
			variant={wrapperVariant}
		>
			<MapField
				value={params}
				noAdd
				setValue={(value: wire.FieldValue) =>
					record.update(fieldId, value, context)
				}
				mode="EDIT"
				context={context}
				keys={Object.keys(paramsDef)}
				keyField={{
					name: "key",
					label: "Param",
				}}
				valueField={{
					name: "value",
					label: "Value",
				}}
			/>
		</FieldWrapper>
	)
}

export default ParamsField

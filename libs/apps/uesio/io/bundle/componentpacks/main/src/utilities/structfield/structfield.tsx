import { wire, collection, definition, context, metadata } from "@uesio/ui"
import Field from "../field/field"
import FieldWrapper from "../fieldwrapper/fieldwrapper"
import { LabelPosition } from "../../components/field/field"

interface StructFieldUtilityProps {
	fieldId: string
	mode: context.FieldMode
	value: wire.PlainWireRecord
	setValue: (value: wire.FieldValue) => void
	subFields?: collection.FieldMetadataMap
	subType?: string
	subFieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	labelPosition?: LabelPosition
	path: string
	record: wire.WireRecord
}

const StructField: definition.UtilityComponent<StructFieldUtilityProps> = (
	props
) => {
	const {
		fieldId,
		subFields,
		mode,
		context,
		subFieldVariant,
		labelVariant,
		labelPosition,
		path,
		record,
		setValue,
	} = props

	const recordId = record?.id
	const value = props.value || {}
	const getNewValue = (
		newFieldValue: wire.PlainFieldValue,
		subfield: collection.FieldMetadata
	) => ({
		...value,
		[subfield.name]: newFieldValue,
	})

	const getValue = (
		item: wire.PlainWireRecord | wire.FieldValue,
		subfield: string
	) => (item as wire.PlainWireRecord)?.[subfield] || undefined

	if (!subFields) return null

	return (
		<div>
			{Object.entries(subFields)
				.filter(([subFieldId]) => !!subFieldId)
				.map(([subfieldId, subfield]) => {
					const subfieldValue = getValue(value, subfieldId)
					return (
						<FieldWrapper
							label={subfield.label || subfield.name}
							labelPosition={labelPosition}
							context={context}
							variant={labelVariant}
							key={`${recordId}:field:${subfieldId}`}
						>
							<Field
								fieldId={`${fieldId}->${subfieldId}`}
								// TODO: Do we need a real wire record here???
								record={{} as wire.WireRecord}
								path={path}
								fieldMetadata={new collection.Field(subfield)}
								value={subfieldValue}
								mode={mode}
								context={context}
								variant={subFieldVariant}
								setValue={(
									newFieldValue: wire.PlainFieldValue
								) =>
									setValue(
										getNewValue(newFieldValue, subfield)
									)
								}
							/>
						</FieldWrapper>
					)
				})}
		</div>
	)
}

export default StructField

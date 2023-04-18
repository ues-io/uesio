import { FunctionComponent } from "react"
import {
	wire,
	collection,
	definition,
	context,
	metadata,
	styles,
} from "@uesio/ui"
import FieldLabel from "../fieldlabel/fieldlabel"
import Field from "../field/field"

interface StructFieldUtilityProps extends definition.UtilityProps {
	fieldId: string
	mode: context.FieldMode
	value: wire.PlainWireRecord
	setValue: (value: wire.FieldValue) => void
	subFields?: collection.FieldMetadataMap
	subType?: string
	fieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	path: string
	record: wire.WireRecord
}

const StructField: FunctionComponent<StructFieldUtilityProps> = (props) => {
	const {
		fieldId,
		subFields,
		mode,
		context,
		fieldVariant,
		labelVariant,
		path,
		record,
		setValue,
	} = props

	const recordId = record?.id
	const value = props.value || {}

	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props
	)

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
		<div className={classes.root}>
			{Object.entries(subFields)
				.filter(([subFieldId]) => !!subFieldId)
				.map(([subfieldId, subfield]) => {
					console.log("subfieldId", subfieldId)
					const subfieldValue = getValue(value, subfieldId)
					return (
						<>
							<FieldLabel
								key={`${recordId}:label:${subfieldId}`}
								label={subfield.label || subfield.name}
								variant={labelVariant}
								context={context}
							/>
							<Field
								key={`${recordId}:field:${subfieldId}`}
								fieldId={`${fieldId}->${subfieldId}`}
								// TODO: Do we need a real wire record here???
								record={{} as wire.WireRecord}
								path={path}
								fieldMetadata={new collection.Field(subfield)}
								value={subfieldValue}
								mode={mode}
								context={context}
								variant={fieldVariant}
								setValue={(
									newFieldValue: wire.PlainFieldValue
								) =>
									setValue(
										getNewValue(newFieldValue, subfield)
									)
								}
							/>
						</>
					)
				})}
		</div>
	)
}

export default StructField

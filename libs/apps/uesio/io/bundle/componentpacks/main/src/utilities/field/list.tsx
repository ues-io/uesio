import {
	wire,
	collection,
	definition,
	context,
	metadata,
	styles,
} from "@uesio/ui"
import Grid from "../grid/grid"
import FieldLabel from "../fieldlabel/fieldlabel"
import IconButton from "../iconbutton/iconbutton"
import Field from "./field"
import { ListFieldOptions } from "./listdeck"

interface ListFieldUtilityProps {
	fieldId: string
	fieldMetadata?: collection.Field
	mode: context.FieldMode
	value: wire.FieldValue
	setValue: (value: wire.FieldValue) => void
	subFields?: collection.FieldMetadataMap
	subType?: collection.FieldType
	addLabel?: string
	deleteLabel?: string
	noAdd?: boolean
	noDelete?: boolean
	subFieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	options?: ListFieldOptions
	getDefaultValue?: () => wire.PlainWireRecord
	path: string
}

const StyleDefaults = Object.freeze({
	root: [],
	row: [],
})

const ListField: definition.UtilityComponent<ListFieldUtilityProps> = (
	props
) => {
	const {
		subFields,
		subType,
		mode,
		context,
		addLabel = context.getLabel("uesio/io.add"),
		deleteLabel = context.getLabel("uesio/io.delete"),
		noAdd,
		noDelete,
		labelVariant,
		path,
		fieldId,
		getDefaultValue = (): wire.FieldValue => {
			if (subType === "STRUCT") return {}
			if (subType === "NUMBER") return 0
			return ""
		},
	} = props

	if (!subType) return null

	const fieldMetadata =
		props.fieldMetadata ||
		context.getRecord()?.getWire().getCollection().getFieldMetadata(fieldId)

	const value = props.value as (wire.PlainWireRecord | wire.FieldValue)[]
	const setValue = props.setValue as (
		value: (wire.PlainWireRecord | wire.FieldValue)[]
	) => void
	const editMode = mode === "EDIT"

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.listfield"
	)
	const subFieldVariant = props.subFieldVariant || props.variant

	const getFields = (): collection.FieldMetadataMap => {
		if (subType === "STRUCT") {
			return subFields || {}
		}

		return {
			value: {
				name: "value",
				namespace: "",
				type: subType,
				createable: true,
				accessible: true,
				updateable: true,
				selectlist:
					subType === "SELECT" || subType === "MULTISELECT"
						? fieldMetadata?.getSelectMetadata()
						: undefined,
				number:
					subType === "NUMBER"
						? fieldMetadata?.getNumberMetadata()
						: undefined,
				file:
					subType === "FILE"
						? fieldMetadata?.getFileMetadata()
						: undefined,
				label: " ",
			},
		}
	}

	const setIndividualValue = (
		index: number,
		subField: wire.FieldMetadata,
		value: wire.FieldValue
	) => {
		setValue(makeIndividualValue(index, subField, value))
	}

	const makeIndividualValue = (
		index: number,
		subField: wire.FieldMetadata,
		newFieldValue: wire.FieldValue
	) => {
		if (!value) return value
		const newValue = [...value]
		if (subType === "STRUCT") {
			newValue[index] = {
				...(newValue[index] as wire.PlainWireRecord),
				[subField.name]: newFieldValue,
			}
		} else {
			newValue[index] = newFieldValue
		}
		return newValue
	}

	const getIndividualValue = (
		item: wire.FieldValue,
		subField: wire.FieldMetadata
	): wire.FieldValue => {
		if (subType === "STRUCT") {
			return (item as wire.PlainWireRecord)[subField.name]
		}
		return item
	}

	const addIndividualValue = () => {
		const newValue = value ? [...value] : []
		newValue.push(getDefaultValue())
		setValue(newValue)
	}

	const removeIndividualValue = (index: number) => {
		setValue(value.filter((_, i) => i !== index))
	}

	const fields = getFields()
	const fieldKeys = Object.keys(fields)

	if (!fieldKeys.length) return null

	const rowClasses = styles.cx(`grid-cols-${fieldKeys.length}`, classes.row)

	return (
		<div className={classes.root}>
			<Grid className={rowClasses} context={context}>
				{fieldKeys.map((subfieldId) => {
					const subfield = fields[subfieldId]
					return (
						<FieldLabel
							key={subfield.label || subfield.name || subfieldId}
							label={subfield.label || subfield.name}
							variant={labelVariant}
							context={context}
						/>
					)
				})}
				{editMode && !noAdd && (
					<IconButton
						label={addLabel}
						icon={noAdd ? "" : "add_circle"}
						context={context}
						className="editicon"
						onClick={addIndividualValue}
						disabled={noAdd}
					/>
				)}
			</Grid>
			{value?.map(
				(item: wire.PlainWireRecord | wire.FieldValue, itemIndex) => (
					<Grid
						key={itemIndex}
						className={rowClasses}
						context={context}
					>
						{fieldKeys.map((subfieldId) => {
							const subfield = fields[subfieldId]
							const subfieldValue = getIndividualValue(
								item,
								subfield
							)
							return (
								<Field
									key={`${itemIndex}_${subfieldId}`}
									fieldId={subfieldId}
									// TODO: If we need to use real wire records here, we'll need to convert item into a WireRecord
									record={{} as wire.WireRecord}
									path={`${path}["${itemIndex}"]`}
									fieldMetadata={
										new collection.Field(subfield)
									}
									value={subfieldValue}
									mode={mode}
									context={context}
									variant={subFieldVariant}
									setValue={(
										newFieldValue: wire.FieldValue
									) =>
										setIndividualValue(
											itemIndex,
											subfield,
											newFieldValue
										)
									}
								/>
							)
						})}
						{editMode && !noDelete && (
							<IconButton
								label={deleteLabel}
								icon="delete"
								className="invisible group-hover:visible"
								context={context}
								onClick={() => {
									removeIndividualValue(itemIndex)
								}}
							/>
						)}
					</Grid>
				)
			)}
		</div>
	)
}

export default ListField

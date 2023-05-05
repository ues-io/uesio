import { FunctionComponent } from "react"
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

interface ListFieldUtilityProps extends definition.UtilityProps {
	fieldId: string
	mode: context.FieldMode
	value: wire.FieldValue
	setValue: (value: wire.FieldValue) => void
	subFields?: collection.FieldMetadataMap
	subType?: collection.FieldType
	noAdd?: boolean
	noDelete?: boolean
	subFieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	options?: ListFieldOptions
	path: string
}

const StyleDefaults = Object.freeze({
	root: [],
	row: [],
})

const SUPPORTED_SUBTYPES = ["STRUCT", "TEXT", "NUMBER"]

const ListField: FunctionComponent<ListFieldUtilityProps> = (props) => {
	const {
		subFields,
		subType,
		mode,
		context,
		noAdd,
		noDelete,
		subFieldVariant,
		labelVariant,
		path,
	} = props
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

	// For now we just support a few subtypes for this list renderer.
	// We can definitely add more.
	if (!subType || !SUPPORTED_SUBTYPES.includes(subType))
		throw new Error("Subtype not supported for list renderer: " + subType)

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
				label: "Value",
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

	const getDefaultValue = (): wire.FieldValue => {
		if (subType === "STRUCT") return {}
		if (subType === "NUMBER") return 0
		return ""
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
						label="add"
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
								label="delete"
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

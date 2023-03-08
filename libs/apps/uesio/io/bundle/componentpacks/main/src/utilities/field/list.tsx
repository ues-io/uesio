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
	subType?: string
	autoAdd?: boolean
	noAdd?: boolean
	fieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	options?: ListFieldOptions
	path: string
}

const ListField: FunctionComponent<ListFieldUtilityProps> = (props) => {
	const {
		subFields,
		subType,
		mode,
		context,
		autoAdd,
		noAdd,
		fieldVariant,
		labelVariant,
		path,
		options,
	} = props
	const value = props.value as (wire.PlainWireRecord | wire.FieldValue)[]
	const setValue = props.setValue as (
		value: (wire.PlainWireRecord | wire.FieldValue)[]
	) => void
	const editMode = mode === "EDIT"
	const isText = subType === "TEXT"
	const numFields = subFields ? Object.keys(subFields).length : 0

	const classes = styles.useUtilityStyles(
		{
			root: {},
			row: {
				gridTemplateColumns: `repeat(${numFields},1fr)${
					editMode ? " 0fr" : ""
				}`,
				".deleteicon": {
					opacity: "0",
				},
				"&:hover": {
					".deleteicon": {
						opacity: "1",
					},
				},
			},
		},
		props
	)

	const getDefaultValue = () =>
		isText ? "" : (options?.defaultDefinition as wire.FieldValue) || {}

	const getNewValue = (
		newFieldValue: wire.FieldValue,
		subfield: collection.FieldMetadata,
		index: number
	) => {
		if (!value) return value
		const newValue = [...value]
		newValue[index] = isText
			? newFieldValue
			: {
					...(newValue[index] as wire.PlainWireRecord),
					[subfield.name]: newFieldValue,
			  }
		return newValue
	}

	const getValue = (
		item: wire.PlainWireRecord | wire.FieldValue,
		subfield: collection.FieldMetadata
	) => (isText ? item : (item as wire.PlainWireRecord)[subfield.name] || "")

	if (!subFields) return null

	// Determine the set of fields to display, prioritizing view-level subfields
	let subFieldDefinitions = options?.subFields?.map((field) => field.fieldId)
	if (!subFieldDefinitions && subFields) {
		subFieldDefinitions = Object.keys(subFields)
		subFieldDefinitions.sort((a: string, b: string) => a.localeCompare(b))
	}

	return (
		<div className={classes.root}>
			<Grid className={classes.row} context={context}>
				{subFieldDefinitions &&
					subFieldDefinitions.map((subfieldId) => {
						const subfield = subFields[subfieldId]
						return (
							<FieldLabel
								key={
									subfield.label ||
									subfield.name ||
									subfieldId
								}
								label={
									isText
										? ""
										: subfield.label || subfield.name
								}
								variant={labelVariant}
								context={context}
							/>
						)
					})}
				{editMode && (
					<IconButton
						label="add"
						icon={autoAdd || noAdd ? "" : "add_circle"}
						context={context}
						className="editicon"
						onClick={() => {
							// We have to do this in a way that doesn't mutate listValue
							// since it can be readonly.
							const newValue = value ? [...value] : []
							newValue.push(getDefaultValue())
							setValue(newValue)
						}}
						disabled={autoAdd || noAdd}
					/>
				)}
			</Grid>
			{value
				?.concat(autoAdd && editMode ? [getDefaultValue()] : [])
				.map(
					(
						item: wire.PlainWireRecord | wire.FieldValue,
						itemIndex
					) => (
						<Grid
							key={itemIndex}
							className={classes.row}
							context={context}
						>
							{subFieldDefinitions &&
								subFieldDefinitions.map((subfieldId) => {
									const subfield = subFields[subfieldId]
									const subfieldValue = getValue(
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
											variant={fieldVariant}
											setValue={(
												newFieldValue: wire.FieldValue
											) =>
												setValue(
													getNewValue(
														newFieldValue,
														subfield,
														itemIndex
													)
												)
											}
										/>
									)
								})}
							{editMode && (
								<IconButton
									label="delete"
									icon="delete"
									className="deleteicon"
									context={context}
									onClick={() => {
										setValue(
											value.filter(
												(_, i) => i !== itemIndex
											)
										)
									}}
								/>
							)}
						</Grid>
					)
				)}
		</div>
	)
}

export { ListFieldUtilityProps }
export default ListField

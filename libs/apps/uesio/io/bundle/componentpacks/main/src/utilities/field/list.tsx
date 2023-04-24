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
	noDelete?: boolean
	subFieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	options?: ListFieldOptions
	path: string
}

const StyleDefaults = Object.freeze({
	root: {},
	row: {},
})

const ListField: FunctionComponent<ListFieldUtilityProps> = (props) => {
	const {
		subFields,
		subType,
		mode,
		context,
		autoAdd,
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
	const isText = subType === "TEXT"
	const numFields = subFields ? Object.keys(subFields).length : 0

	const classes = styles.useUtilityStyles(
		StyleDefaults,
		props,
		"uesio/io.listfield"
	)

	const getDefaultValue = () => (isText ? "" : {})

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
	const subFieldDefinitions = subFields ? Object.keys(subFields) : undefined

	const rowClasses = styles.cx(`grid-cols-${numFields}`, classes.row)

	return (
		<div className={classes.root}>
			<Grid className={rowClasses} context={context}>
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
				{editMode && !noAdd && (
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
							className={rowClasses}
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
											variant={subFieldVariant}
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
							{editMode && !noDelete && (
								<IconButton
									label="delete"
									icon="delete"
									className="invisible group-hover:visible"
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

export default ListField

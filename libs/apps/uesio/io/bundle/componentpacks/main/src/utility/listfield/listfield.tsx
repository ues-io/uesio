import { FunctionComponent } from "react"
import {
	wire,
	collection,
	definition,
	context,
	metadata,
	component,
	styles,
} from "@uesio/ui"

const TextField = component.getUtility("uesio/io.textfield")
const IconButton = component.getUtility("uesio/io.iconbutton")
const Grid = component.getUtility("uesio/io.grid")
const FieldLabel = component.getUtility("uesio/io.fieldlabel")

interface ListFieldUtilityProps extends definition.UtilityProps {
	mode: context.FieldMode
	value: (wire.PlainWireRecord | wire.FieldValue)[]
	setValue: (value: (wire.PlainWireRecord | wire.FieldValue)[]) => void
	subFields: collection.FieldMetadataMap
	subType: string
	autoAdd?: boolean
	noAdd?: boolean
	fieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
}

const ListField: FunctionComponent<ListFieldUtilityProps> = (props) => {
	const {
		subFields,
		subType,
		mode,
		context,
		value,
		setValue,
		autoAdd,
		noAdd,
		fieldVariant,
		labelVariant,
	} = props
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

	return (
		<div className={classes.root}>
			<Grid className={classes.row} context={context}>
				{subFields &&
					Object.keys(subFields).map((subfieldId) => {
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
				.map((item: wire.PlainWireRecord | wire.FieldValue, index) => (
					<Grid key={index} className={classes.row} context={context}>
						{subFields &&
							Object.keys(subFields).map((subfieldId, i) => {
								const subfield = subFields[subfieldId]
								const subfieldValue = getValue(item, subfield)
								return (
									<TextField
										key={i}
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
													index
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
										value.filter((_, i) => i !== index)
									)
								}}
							/>
						)}
					</Grid>
				))}
		</div>
	)
}

export { ListFieldUtilityProps }
export default ListField

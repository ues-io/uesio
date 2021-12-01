import { FunctionComponent } from "react"
import {
	wire,
	collection,
	definition,
	context,
	component,
	styles,
} from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")
const IconButton = component.registry.getUtility("io.iconbutton")
const Grid = component.registry.getUtility("io.grid")
const FieldLabel = component.registry.getUtility("io.fieldlabel")

interface Props extends definition.UtilityProps {
	mode: context.FieldMode
	value: (wire.PlainWireRecord | wire.FieldValue)[]
	setValue: (value: (wire.PlainWireRecord | wire.FieldValue)[]) => void
	subFields: collection.FieldMetadataMap
	subType: string
	autoAdd?: boolean
	fieldVariant?: string
}

const ListField: FunctionComponent<Props> = (props) => {
	const {
		subFields,
		subType,
		mode,
		context,
		value,
		setValue,
		autoAdd,
		fieldVariant,
	} = props
	const editMode = mode === "EDIT"
	const isText = subType === "TEXT"
	const numFields = subFields ? Object.keys(subFields).length : 0

	const classes = styles.useUtilityStyles(
		{
			root: {
				gridTemplateColumns: `repeat(${numFields},1fr)${
					editMode ? " 0fr" : ""
				}`,
				alignItems: "center",
				columnGap: "10px",
				rowGap: "10px",
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

	return subFields ? (
		<div>
			<Grid className={classes.root} context={context}>
				{subFields &&
					Object.keys(subFields).map((subfieldId, index) => {
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
								context={context}
							/>
						)
					})}
				{editMode && (
					<IconButton
						label="add"
						icon={autoAdd ? "" : "add_circle"}
						context={context}
						className="editicon"
						onClick={() => {
							// We have to do this in a way that doesn't mutate listValue
							// since it can be readonly.
							const newValue = value ? [...value] : []
							newValue.push(getDefaultValue())
							setValue(newValue)
						}}
						disabled={autoAdd}
					/>
				)}
			</Grid>
			{value
				?.concat(autoAdd && editMode ? [getDefaultValue()] : [])
				.map((item: wire.PlainWireRecord | wire.FieldValue, index) => (
					<Grid
						key={index}
						className={classes.root}
						context={context}
					>
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
	) : null
}

export default ListField

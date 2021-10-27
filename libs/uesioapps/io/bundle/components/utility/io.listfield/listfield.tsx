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
	label?: string
	mode: context.FieldMode
	value: (wire.PlainWireRecord | wire.FieldValue)[]
	setValue: (value: (wire.PlainWireRecord | wire.FieldValue)[]) => void
	subFields: collection.SubField[]
	subType: string
	autoAdd?: boolean
}

const ListField: FunctionComponent<Props> = (props) => {
	const {
		subFields,
		subType,
		mode,
		context,
		value,
		label,
		setValue,
		autoAdd,
	} = props
	const editMode = mode === "EDIT"
	const isText = subType === "TEXT"
	const rowStyles = {
		root: {
			gridTemplateColumns: `repeat(${subFields.length},1fr)${
				editMode ? " 0fr" : ""
			}`,
			alignItems: "center",
			columnGap: "10px",
			".deleteicon": {
				opacity: "0",
			},
			"&:hover": {
				".deleteicon": {
					opacity: "1",
				},
			},
		},
	}

	const getDefaultValue = () => (isText ? "" : {})

	const getNewValue = (
		newFieldValue: wire.FieldValue,
		subfield: collection.SubField,
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
		subfield: collection.SubField
	) => (isText ? item : (item as wire.PlainWireRecord)[subfield.name] || "")

	return subFields ? (
		<div>
			<FieldLabel label={label} context={context} />
			<Grid styles={rowStyles} context={context}>
				{!isText &&
					subFields.map((subfield) => (
						<FieldLabel
							label={subfield.label || subfield.name}
							context={context}
						/>
					))}
				{editMode && !autoAdd && (
					<IconButton
						label="add"
						icon="add_circle"
						context={context}
						className="editicon"
						onClick={() => {
							// We have to do this in a way that doesn't mutate listValue
							// since it can be readonly.
							const newValue = value ? [...value] : []
							newValue.push(getDefaultValue())
							setValue(newValue)
						}}
					/>
				)}
			</Grid>
			{value
				?.concat(autoAdd && editMode ? [getDefaultValue()] : [])
				.map((item: wire.PlainWireRecord | wire.FieldValue, index) => (
					<Grid styles={rowStyles} context={context}>
						{subFields.map((subfield) => (
							<TextField
								hideLabel
								value={getValue(item, subfield)}
								mode={mode}
								context={context}
								setValue={(newFieldValue: wire.FieldValue) =>
									setValue(
										getNewValue(
											newFieldValue,
											subfield,
											index
										)
									)
								}
							/>
						))}
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

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
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")
const Grid = component.registry.getUtility("io.grid")
const FieldLabel = component.registry.getUtility("io.fieldlabel")

interface Props extends definition.UtilityProps {
	label?: string
	mode: context.FieldMode
	value: wire.PlainWireRecord[]
	setValue: (value: wire.PlainWireRecord[]) => void
	subFields: collection.SubField[]
	autoAdd?: boolean
}

const ListField: FunctionComponent<Props> = (props) => {
	const {
		subFields,
		mode,
		context,
		value = [],
		label,
		setValue,
		autoAdd = true,
	} = props
	const editMode = mode === "EDIT"
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
	return subFields ? (
		<div>
			<FieldLabel label={label} context={context} />
			<Grid styles={rowStyles} context={context}>
				{subFields.map((subfield) => (
					<FieldLabel label={subfield.name} context={context}>
						{subfield.name}
					</FieldLabel>
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
							const newValue = [...value]
							newValue.push({})
							setValue(newValue)
						}}
					/>
				)}
			</Grid>
			{value
				.concat(autoAdd && editMode ? [{}] : [])
				.map((item: wire.PlainWireRecord, index) => (
					<Grid styles={rowStyles} context={context}>
						{subFields.map((subfield) => (
							<TextField
								hideLabel
								value={item[subfield.name] || ""}
								mode={mode}
								context={context}
								setValue={(newFieldValue: wire.FieldValue) => {
									// We have to do this in a way that doesn't mutate listValue
									// since it can be readonly.
									const newValue = [...value]
									newValue[index] = {
										...newValue[index],
										[subfield.name]: newFieldValue,
									}
									setValue(newValue)
								}}
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

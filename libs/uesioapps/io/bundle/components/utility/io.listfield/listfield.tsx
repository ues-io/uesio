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
const Group = component.registry.getUtility("io.group")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")
const Grid = component.registry.getUtility("io.grid")

interface Props extends definition.UtilityProps {
	label?: string
	mode: context.FieldMode
	value: wire.PlainWireRecord[]
	setValue: (value: wire.PlainWireRecord[]) => void
	subFields: collection.SubField[]
}

const ListField: FunctionComponent<Props> = (props) => {
	const { subFields, mode, context, value, label, setValue } = props
	const editMode = mode === "EDIT"
	return subFields ? (
		<div>
			<TitleBar
				title={label}
				actions={
					editMode && (
						<IconButton
							label="add"
							icon="add_circle"
							context={context}
							onClick={() => {
								// We have to do this in a way that doesn't mutate listValue
								// since it can be readonly.
								const newValue = [...value]
								newValue.push({})
								setValue(newValue)
							}}
						/>
					)
				}
				context={context}
			/>
			{value.map((item: wire.PlainWireRecord, index) => (
				<Grid
					styles={{
						root: {
							gridTemplateColumns: "1fr 0fr",
							alignItems: "center",
						},
					}}
					context={context}
				>
					<Group context={context}>
						{subFields.map((subfield) => (
							<TextField
								label={subfield.name}
								value={item[subfield.name]}
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
					</Group>
					{editMode && (
						<IconButton
							label="delete"
							icon="delete"
							context={context}
							onClick={() => {
								setValue(value.filter((_, i) => i !== index))
							}}
						/>
					)}
				</Grid>
			))}
		</div>
	) : null
}

export default ListField

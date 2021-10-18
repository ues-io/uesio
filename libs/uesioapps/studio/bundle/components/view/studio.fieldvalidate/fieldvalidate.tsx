import { FunctionComponent, useState } from "react"
import { definition, hooks, component, collection } from "@uesio/ui"

type FieldValidateDefinition = {
	fieldId: string
	wireName: string
}

interface Props extends definition.BaseProps {
	definition: FieldValidateDefinition
}

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")
const addBlankSelectOption = collection.addBlankSelectOption

const FieldValidate: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId, wireName },
	} = props

	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = uesio.wire.useWire(wireName || "")

	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const nameField = collection.getNameField()
	const nameNameField = nameField?.getId()
	if (!nameNameField) return null

	const mode = context.getFieldMode() || "READ"
	const value = record.getFieldReference(fieldId) || {}
	console.log("DAta", { value })

	if (!value) return null

	const handleSelect = (type: string) => {
		let updValue = { ...selValue }

		switch (type) {
			case "":
				updValue = { ["Type"]: "", ["Regex"]: "" }
				console.log("updValue", updValue)
				record.update(fieldId, updValue)
				setSelValue(updValue)
				break
			case "EMAIL":
			case "METADATA":
				updValue = { ["Type"]: type, ["Regex"]: "" }
				console.log("updValue", updValue)
				record.update(fieldId, updValue)
				setSelValue(updValue)
				break
			default:
				updValue = { ["Type"]: type }
				console.log("updValue", updValue)
				record.update(fieldId, updValue)
				setSelValue(updValue)
		}
	}

	const [selValue, setSelValue] = useState(value)
	console.log("sel", selValue)

	return (
		<>
			<SelectField
				context={context}
				label={"Validation type:"}
				value={selValue.Type}
				mode={mode}
				options={addBlankSelectOption([
					{
						value: "EMAIL",
						label: "email",
					},
					{
						value: "REGEX",
						label: "regex",
					},
					{
						value: "METADATA",
						label: "metadata",
					},
				])}
				setValue={(value: string) => {
					handleSelect(value)
				}}
			/>
			{value.Type === "REGEX" && (
				<TextField
					context={context}
					label={"regex:"}
					value={selValue.Regex}
					mode={mode}
					setValue={(value: string) => {
						const updValue = {
							...selValue,
							["Regex"]: value,
						}
						setSelValue(updValue)
						record.update(fieldId, updValue)
					}}
				/>
			)}
		</>
	)
}

export default FieldValidate

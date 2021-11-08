import { FunctionComponent } from "react"
import { builder, component } from "@uesio/ui"

const SelectField = component.registry.getUtility("io.selectfield")
const CheckBoxField = component.registry.getUtility("io.checkboxfield")

const BooleanProp: FunctionComponent<builder.PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => {
	const selected = !!valueAPI.get(path)

	switch ((descriptor as builder.BooleanProp).displaytype) {
		case "switch":
			return <div>Switch not supported yet</div>
		case "select": {
			const optionslist: builder.PropertySelectOption[] = [
				{
					value: "true",
					label: "True",
				},
				{
					value: "false",
					label: "False",
				},
			]

			return (
				<SelectField
					value={selected}
					label={descriptor.label}
					setValue={(value: string) =>
						valueAPI.set(path, value === "true")
					}
					options={optionslist}
					context={context}
				/>
			)
		}
		default:
			//Checkbox as default
			return (
				<CheckBoxField
					value={selected}
					label={descriptor.label}
					setValue={(value: boolean) => valueAPI.set(path, value)}
					context={context}
				/>
			)
	}
}

export default BooleanProp

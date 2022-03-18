import { FunctionComponent } from "react"
import { builder, component } from "@uesio/ui"

const SelectField = component.registry.getUtility("uesio/io.selectfield")
const CheckBoxField = component.registry.getUtility("uesio/io.checkboxfield")
const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")

const BooleanProp: FunctionComponent<builder.PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => {
	const selected = !!valueAPI.get(path)
	const getInput = () => {
		switch ((descriptor as builder.BooleanProp).displaytype) {
			case "switch":
				return <div>Switch not supported yet</div>
			case "select": {
				return (
					<SelectField
						value={selected}
						setValue={(value: string) =>
							valueAPI.set(path, value === "true")
						}
						options={[
							{ value: "true", label: "True" },
							{ value: "false", label: "False" },
						]}
						context={context}
						variant="studio.propfield"
					/>
				)
			}
			default:
				return (
					<CheckBoxField
						value={selected}
						setValue={(value: boolean) => valueAPI.set(path, value)}
						context={context}
					/>
				)
		}
	}

	return (
		<FieldWrapper
			variant="studio.propfield"
			labelPosition="left"
			label={descriptor.label}
			context={context}
		>
			{getInput()}
		</FieldWrapper>
	)
}

export default BooleanProp

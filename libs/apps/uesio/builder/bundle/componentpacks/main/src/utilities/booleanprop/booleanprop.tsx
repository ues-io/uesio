import { builder, component } from "@uesio/ui"

const BooleanProp: builder.PropComponent<builder.BooleanProp> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => {
	const SelectField = component.getUtility("uesio/io.selectfield")
	const CheckBoxField = component.getUtility("uesio/io.checkboxfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
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
						variant="uesio/builder.propfield"
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
			variant="uesio/builder.propfield"
			labelPosition="left"
			label={descriptor.label}
			context={context}
		>
			{getInput()}
		</FieldWrapper>
	)
}

export default BooleanProp

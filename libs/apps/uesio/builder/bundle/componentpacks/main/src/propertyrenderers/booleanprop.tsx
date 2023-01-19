import { component, definition } from "@uesio/ui"
import { get, set } from "../api/defapi"
import { FullPath } from "../api/path"

interface BooleanProps {
	label: string
	path: FullPath
	displayType?: string
}

const BooleanProp: definition.UtilityComponent<BooleanProps> = ({
	label,
	path,
	context,
	displayType,
}) => {
	const SelectField = component.getUtility("uesio/io.selectfield")
	const CheckBoxField = component.getUtility("uesio/io.checkboxfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const selected = !!get(context, path)
	const getInput = () => {
		switch (displayType) {
			case "switch":
				return <div>Switch not supported yet</div>
			case "select": {
				return (
					<SelectField
						value={selected}
						setValue={
							(/*value: string*/) => {
								//valueAPI.set(path, value === "true")
							}
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
						setValue={(value: boolean) => {
							set(context, path, value)
						}}
						context={context}
					/>
				)
		}
	}

	return (
		<FieldWrapper
			variant="uesio/builder.propfield"
			labelPosition="left"
			label={label}
			context={context}
		>
			{getInput()}
		</FieldWrapper>
	)
}

export default BooleanProp

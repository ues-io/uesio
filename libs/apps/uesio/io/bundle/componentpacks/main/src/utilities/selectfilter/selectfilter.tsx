import { FunctionComponent } from "react"
import { definition, api, wire, collection } from "@uesio/ui"
import SelectField from "../field/select"

const addBlankSelectOption = collection.addBlankSelectOption

interface SelectFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
}

const SelectFilter: FunctionComponent<SelectFilterProps> = (props) => {
	const { wire, fieldMetadata, context, condition } = props
	const wireId = wire.getId()

	return (
		<SelectField
			fieldMetadata={fieldMetadata}
			context={context}
			options={addBlankSelectOption(
				fieldMetadata.getSelectMetadata()?.options || [],
				"Any " + fieldMetadata.getLabel()
			)}
			variant={"uesio/io.filter"}
			value={condition.value || ""}
			setValue={(value: string) => {
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value,
								active: !!value,
							},
						},
						{
							signal: "wire/LOAD",
							wires: [wireId],
						},
					],
					context
				)
			}}
		/>
	)
}

export default SelectFilter

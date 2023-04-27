import { FunctionComponent } from "react"
import { definition, api, wire, collection } from "@uesio/ui"
import MultiSelectField from "../field/multiselect"

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
		<MultiSelectField
			fieldMetadata={fieldMetadata}
			context={context}
			options={addBlankSelectOption(
				fieldMetadata.getSelectMetadata()?.options || [],
				"Any " + fieldMetadata.getLabel()
			)}
			variant={"uesio/io.filter"}
			value={[condition.value] || [""]}
			setValue={(value: string[]) => {
                console.log("value: ", value)
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

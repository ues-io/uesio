import { FunctionComponent } from "react"
import { definition, component, hooks, wire, collection } from "@uesio/ui"

const SelectField = component.getUtility("uesio/io.selectfield")

const addBlankSelectOption = collection.addBlankSelectOption

interface SelectFilterProps extends definition.UtilityProps {
	wire: wire.Wire
	fieldMetadata: collection.Field
}

const SelectFilter: FunctionComponent<SelectFilterProps> = (props) => {
	const { wire, fieldMetadata, context } = props

	const uesio = hooks.useUesio(props)

	return (
		<SelectField
			context={context}
			options={addBlankSelectOption(
				fieldMetadata.getSelectMetadata()?.options || [],
				"Any " + fieldMetadata.getLabel()
			)}
			variant={"uesio/io.filter"}
			setValue={(value: string) => {
				uesio.signal.runMany(
					[
						value
							? {
									signal: "wire/SET_CONDITION",
									wire: wire.getId(),
									condition: {
										id: props.path,
										field: fieldMetadata.getId(),
										value,
										active: true,
									},
							  }
							: {
									signal: "wire/REMOVE_CONDITION",
									wire: wire.getId(),
									condition: props.path,
							  },
						{
							signal: "wire/LOAD",
							wires: [wire.getId()],
						},
					],
					context
				)
			}}
		/>
	)
}

export default SelectFilter

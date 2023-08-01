import { definition, api, collection, wire } from "@uesio/ui"
import TextField from "../field/text"
import debounce from "lodash/debounce"
interface TextFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
	placeholder?: string
}

const TextFilter: definition.UtilityComponent<TextFilterProps> = (props) => {
	const { wire, context, condition, placeholder } = props
	const wireId = wire.getId()

	const search = (value: string) => {
		api.signal.runMany(
			[
				{
					signal: "wire/SET_CONDITION",
					wire: wireId,
					condition: {
						...condition,
						value,
						inactive: value === undefined || value === "",
					},
				},
				{
					signal: "wire/LOAD",
					wires: [wireId],
				},
			],
			context
		)
	}
	const debouncedRequest = debounce(search, 600)

	return (
		<TextField
			context={context}
			variant={"uesio/io.filter"}
			value={condition.value || ""}
			placeholder={placeholder}
			setValue={(value: string) => {
				debouncedRequest(value)
			}}
		/>
	)
}

export default TextFilter

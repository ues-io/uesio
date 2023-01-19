import { definition } from "@uesio/ui"
import SelectProp from "./selectprop"
import { FullPath } from "../api/path"

type DefinitionSelectorProps = {
	path: FullPath
	label: string
	definitionPath: string
	noValueLabel: string
	filter?: (def: unknown, index: string | number) => boolean
	valueGrabber?: (def: unknown, index: string | number) => string | undefined
	labelGrabber?: (def: unknown, index: string | number) => string | undefined
}
const DefinitionSelectorProp: definition.UtilityComponent<
	DefinitionSelectorProps
> = (props) => {
	const definitions = {} as definition.DefinitionMap

	let entries = Object.keys(definitions || {})
	if (props.filter) {
		const filter = props.filter
		entries = entries.filter((key) => filter(definitions[key], key))
	}

	const options = [
		{
			value: "",
			label: props.noValueLabel,
		},
		...entries.map((id) => ({
			value: props.valueGrabber
				? props.valueGrabber(definitions[id], id) || id
				: id,
			label: props.labelGrabber
				? props.labelGrabber(definitions[id], id) || id
				: id,
		})),
	]

	return <SelectProp {...props} options={options} context={props.context} />
}

export default DefinitionSelectorProp

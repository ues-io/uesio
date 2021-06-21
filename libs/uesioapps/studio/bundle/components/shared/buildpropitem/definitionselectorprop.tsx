import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, definition } from "@uesio/ui"
import SelectProp from "./selectprop"

type DefinitionSelectorProps = PropRendererProps & {
	definitionPath: string
	noValueLabel: string
	filter?: (def: definition.Definition, index: string | number) => boolean
	valueGrabber?: (
		def: definition.Definition,
		index: string | number
	) => string | undefined
	labelGrabber?: (
		def: definition.Definition,
		index: string | number
	) => string | undefined
}
const DefinitionSelectorProp: FunctionComponent<DefinitionSelectorProps> = (
	props
) => {
	const uesio = hooks.useUesio(props)
	const descriptor = props.descriptor

	const definitions = uesio.view.useDefinition(
		props.definitionPath
	) as definition.DefinitionMap

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

	return (
		<SelectProp
			{...props}
			descriptor={{
				...descriptor,
				type: "SELECT",
				options,
			}}
		/>
	)
}

export default DefinitionSelectorProp

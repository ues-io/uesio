import { wire, definition } from "@uesio/ui"
import { FullPath } from "../api/path"
import MultiSelectProp from "./multiselectprop"

interface WireProps {
	label: string
	path: FullPath
}

const WiresProp: definition.UtilityComponent<WireProps> = (props) => {
	const availableWires = {} as wire.WireDefinitionMap
	return (
		<MultiSelectProp
			{...props}
			options={Object.keys(availableWires).map((wireId) => ({
				value: wireId,
				label: wireId,
			}))}
		/>
	)
}

export default WiresProp

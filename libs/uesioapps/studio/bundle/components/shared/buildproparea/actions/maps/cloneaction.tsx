import { FunctionComponent } from "react"
import { ActionProps } from "../actiondefinition"
import ActionButton from "../actionbutton"
import { component, definition } from "@uesio/ui"

const CloneActionMaps: FunctionComponent<ActionProps> = (props) => {
	const { path = "", valueAPI, context, action = { label: "copy" } } = props

	const onClickClone = () => {
		const [metadataType, metadataItem] =
			component.path.getFullPathParts(path)

		const parentDef = valueAPI.get(
			'["' + metadataType + '"]'
		) as definition.DefinitionMap

		const value = parentDef[metadataItem]
		const newKey = metadataItem + (Math.floor(Math.random() * 60) + 1)
		valueAPI.addPair('["' + metadataType + '"]', value, newKey)
	}

	return (
		<ActionButton
			title={action.label}
			onClick={onClickClone}
			icon="copy"
			context={context}
		/>
	)
}

export default CloneActionMaps

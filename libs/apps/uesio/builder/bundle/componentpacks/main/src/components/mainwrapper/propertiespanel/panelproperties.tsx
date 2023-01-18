import { definition } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import { setSelectedPath, useSelectedPath } from "../../../api/stateapi"

import { useDefinition } from "../../../api/defapi"

const PanelProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const selectedDef = useDefinition(selectedPath)

	console.log(selectedDef)

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={selectedPath}
			title={"panel"}
			onUnselect={() => setSelectedPath(context)}
		>
			<div>Panel Properties</div>
		</PropertiesWrapper>
	)
}

PanelProperties.displayName = "PanelProperties"

export default PanelProperties

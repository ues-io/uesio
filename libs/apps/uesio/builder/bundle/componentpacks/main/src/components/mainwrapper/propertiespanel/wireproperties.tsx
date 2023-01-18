import { definition } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import { setSelectedPath, useSelectedPath } from "../../../api/stateapi"

import { useDefinition } from "../../../api/defapi"

const WireProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const selectedDef = useDefinition(selectedPath)

	console.log(selectedDef)

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={selectedPath}
			title={"wire"}
			onUnselect={() => setSelectedPath(context)}
		>
			<div>Wire Properties</div>
		</PropertiesWrapper>
	)
}

WireProperties.displayName = "WireProperties"

export default WireProperties

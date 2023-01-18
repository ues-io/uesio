import { definition } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import { setSelectedPath, useSelectedPath } from "../../../api/stateapi"

import { useDefinition } from "../../../api/defapi"

const ParamProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const selectedDef = useDefinition(selectedPath)

	console.log(selectedDef)

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={selectedPath}
			title={"param"}
			onUnselect={() => setSelectedPath(context)}
		>
			<div>Param Properties</div>
		</PropertiesWrapper>
	)
}

ParamProperties.displayName = "ParamProperties"

export default ParamProperties

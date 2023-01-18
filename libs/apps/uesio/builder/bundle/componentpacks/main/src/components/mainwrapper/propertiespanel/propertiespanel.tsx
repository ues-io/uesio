import { definition } from "@uesio/ui"

import { useSelectedPath } from "../../../api/stateapi"
import ComponentInstanceProperties from "./componentinstanceproperties"
import ComponentTypeProperties from "./componenttypeproperties"
import NothingSelectedProperties from "./nothingselectedproperties"
import PanelProperties from "./panelproperties"
import ParamProperties from "./paramproperties"
import WireProperties from "./wireproperties"

const PropertiesPanel: definition.UtilityComponent = (props) => {
	const { context } = props
	const selectedPath = useSelectedPath(context)
	switch (selectedPath.itemType) {
		case "viewdef": {
			const [firstNode] = selectedPath.shift()
			switch (firstNode) {
				case "components":
					return <ComponentInstanceProperties {...props} />
				case "wires":
					return <WireProperties {...props} />
				case "panels":
					return <PanelProperties {...props} />
				case "params":
					return <ParamProperties {...props} />
			}
			break
		}
		case "component": {
			return <ComponentTypeProperties {...props} />
		}
	}
	return <NothingSelectedProperties {...props} />
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel

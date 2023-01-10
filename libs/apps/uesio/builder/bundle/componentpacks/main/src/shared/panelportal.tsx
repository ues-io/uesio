import { useEffect } from "react"
import { definition, api, component } from "@uesio/ui"

const PanelPortal: definition.UtilityComponent = (props) => {
	const [metadataType, , selectedPath] = api.builder.useSelectedNode()

	const pathArray = component.path.toPath(selectedPath)
	const isPanel = metadataType === "viewdef" && pathArray[0] === "panels"
	const panelId = pathArray[1]
	const togglePanel = api.signal.getHandler(
		[
			{
				signal: "panel/OPEN",
				panel: panelId,
			},
		],
		props.context
	)
	useEffect(() => {
		if (isPanel && togglePanel) {
			togglePanel()
		}
	}, [selectedPath])
	return <></>
}

export default PanelPortal

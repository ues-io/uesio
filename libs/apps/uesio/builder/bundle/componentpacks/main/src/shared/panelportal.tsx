import { useEffect } from "react"
import { definition, api, component } from "@uesio/ui"
import { useSelectedPath } from "../api/stateapi"

const PanelPortal: definition.UtilityComponent = (props) => {
	const selectedPath = useSelectedPath(props.context)

	const pathArray = component.path.toPath(selectedPath)
	const isPanel =
		selectedPath.itemType === "viewdef" && pathArray[0] === "panels"
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

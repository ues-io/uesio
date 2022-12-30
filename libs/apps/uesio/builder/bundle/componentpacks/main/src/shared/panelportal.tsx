import { FC, useEffect } from "react"
import { definition, hooks, component } from "@uesio/ui"

const PanelPortal: FC<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const [metadataType, , selectedPath] = uesio.builder.useSelectedNode()

	const pathArray = component.path.toPath(selectedPath)
	const isPanel = metadataType === "viewdef" && pathArray[0] === "panels"
	const panelId = pathArray[1]
	const togglePanel = uesio.signal.getHandler(
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

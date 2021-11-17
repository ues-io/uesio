import { FC, useEffect } from "react"
import { definition, hooks } from "@uesio/ui"

interface Y extends definition.UtilityProps {
	panelId: string
}
const PanelPortal: FC<Y> = (props) => {
	const uesio = hooks.useUesio(props)
	const [togglePanel, portals] = uesio.signal.useHandler([
		{
			signal: "panel/OPEN",
			panel: props.panelId as string,
		},
	])
	useEffect(() => {
		togglePanel && togglePanel()
	}, [props.panelId])
	return <>{portals}</>
}

export default PanelPortal

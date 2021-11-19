import { FC, useEffect, useLayoutEffect } from "react"
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
		const { path, panelId } = props
		console.log({ panelId, path })
		togglePanel && togglePanel()
	}, [props.panelId, props.path])
	return <>{portals}</>
}

export default PanelPortal

import { FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"
import { useUesio } from "../hooks/hooks"

import PlainDialog from "../panels/plaindialog"
import Dialog from "../panels/dialog"

const PanelContent: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
	const panelId = props.definition?.id as string
	const panelType = props.definition?.type as string
	const closeHandler = uesio.signal.getHandler([
		{
			signal: "panel/TOGGLE",
			panel: panelId,
		},
	])

	if (panelType === "plaindialog") {
		return <PlainDialog close={closeHandler} {...props} />
	}
	if (panelType === "dialog") {
		return <Dialog close={closeHandler} {...props} />
	}
	return null
}

export default PanelContent

import { FunctionComponent, RefObject, useEffect, useRef } from "react"
import { BaseProps, DefinitionMap } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import { set as setPanel } from "../bands/panel"
import { usePanel } from "../bands/panel/selectors"
import PlainDialog from "../panels/plaindialog"
import Dialog from "../panels/dialog"

type PanelInfo = {
	domNode: RefObject<HTMLDivElement>
	definition: DefinitionMap | undefined
}

const panelRegistry: Record<string, PanelInfo> = {}

const Panel: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
	const panelId = props.definition?.id as string
	const panelType = props.definition?.type as string
	const ref = useRef<HTMLDivElement>(null)

	const panel = usePanel(panelId)

	const closeHandler = uesio.signal.getHandler([
		{
			signal: "panel/TOGGLE",
			panel: panelId,
		},
	])

	useEffect(() => {
		uesio.getDispatcher()(
			setPanel({
				id: panelId,
				open: false,
				type: panelType,
				contextPath: "",
			})
		)
		panelRegistry[panelId] = {
			domNode: ref,
			definition: props.definition,
		}
	}, [])

	if (panel?.type === "plaindialog") {
		return (
			<PlainDialog
				close={closeHandler}
				ref={ref}
				panel={panel}
				{...props}
			/>
		)
	}
	if (panel?.type === "dialog") {
		return (
			<Dialog close={closeHandler} ref={ref} panel={panel} {...props} />
		)
	}
	return null
}

export { panelRegistry }
export default Panel

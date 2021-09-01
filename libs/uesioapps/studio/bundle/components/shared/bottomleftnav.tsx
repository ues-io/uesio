import { CSSProperties, FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

const IconButton = component.registry.getUtility("io.iconbutton")
const ScrollPanel = component.registry.getUtility("io.scrollpanel")

const BottomLeftNav: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)

	return (
		<ScrollPanel
			className={props.className}
			context={props.context}
			variant="studio.verticalnav"
		>
			<IconButton
				context={props.context}
				variant="io.large"
				onClick={uesio.signal.getHandler([
					{
						signal: "component/uesio.runtime/SHOW_COMPS",
					},
				])}
				label="Components"
				tooltipPlacement="right"
				icon="widgets"
			/>
			<IconButton
				context={props.context}
				variant="io.large"
				onClick={uesio.signal.getHandler([
					{
						signal: "component/uesio.runtime/SHOW_WIRES",
					},
				])}
				label="Wires"
				tooltipPlacement="right"
				icon="power"
			/>
			<IconButton
				context={props.context}
				variant="io.large"
				onClick={uesio.signal.getHandler([
					{
						signal: "component/uesio.runtime/SHOW_MODALS",
					},
				])}
				label="Modals"
				tooltipPlacement="right"
				icon={uesio.getTheme().definition.icons.panels}
			/>
		</ScrollPanel>
	)
}

BottomLeftNav.displayName = "BottomLeftNav"

export default BottomLeftNav

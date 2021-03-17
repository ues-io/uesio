import { CSSProperties, FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

const IconButton = component.registry.getUtility("io.iconbutton")
const ScrollPanel = component.registry.getUtility("io.scrollpanel")

interface Props extends definition.BaseProps {
	style?: CSSProperties
}

const BottomLeftNav: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)

	return (
		<ScrollPanel {...props} variant="studio.verticalnav">
			<IconButton
				{...props}
				variant="io.large"
				onClick={uesio.signal.getHandler([
					{
						signal: "component/uesio.runtime/SHOW_COMPS",
					},
				])}
				label="Components"
				icon="widgets"
			/>
			<IconButton
				{...props}
				variant="io.large"
				onClick={uesio.signal.getHandler([
					{
						signal: "component/uesio.runtime/SHOW_WIRES",
					},
				])}
				label="Wires"
				icon="power"
			/>
		</ScrollPanel>
	)
}

export default BottomLeftNav

import { CSSProperties, FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

const IconButton = component.registry.getUtility("io.iconbutton")
const ScrollPanel = component.registry.getUtility("io.scrollpanel")

interface Props extends definition.BaseProps {
	style?: CSSProperties
}

const TopLeftNav: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const isStructureView = uesio.builder.useIsStructureView()
	const [label, icon] = isStructureView
		? ["Switch to Content View", "border_outer"]
		: ["Switch to Structure View", "border_clear"]

	return (
		<ScrollPanel {...props} variant="studio.verticalnav">
			<IconButton
				{...props}
				variant="io.large"
				onClick={uesio.signal.getHandler([
					{
						signal: "component/uesio.runtime/TOGGLE_VIEW",
					},
				])}
				label={label}
				icon={icon}
			/>
		</ScrollPanel>
	)
}

export default TopLeftNav

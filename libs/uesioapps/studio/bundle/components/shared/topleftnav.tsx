import { CSSProperties, FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

const IconButton = component.registry.getUtility("io.iconbutton")
const ScrollPanel = component.registry.getUtility("io.scrollpanel")

interface Props extends definition.BaseProps {
	style?: CSSProperties
}

const TopLeftNav: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const builderView = uesio.builder.useView()

	return (
		<ScrollPanel {...props} variant="studio.verticalnav">
			{builderView === "contentview" && (
				<IconButton
					{...props}
					variant="io.large"
					onClick={() => uesio.builder.setView("structureview")}
					label="Switch to Structure View"
					icon="border_clear"
				/>
			)}
			{builderView !== "contentview" && (
				<IconButton
					{...props}
					variant="io.large"
					onClick={() => uesio.builder.setView("contentview")}
					label="Switch to Content View"
					icon="border_outer"
				/>
			)}
		</ScrollPanel>
	)
}

export default TopLeftNav

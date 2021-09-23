import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

const IconButton = component.registry.getUtility("io.iconbutton")
const ScrollPanel = component.registry.getUtility("io.scrollpanel")

const TopLeftNav: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const isStructureView = uesio.builder.useIsStructureView()
	const [label, icon] = isStructureView
		? ["Switch to Content View", "border_outer"]
		: ["Switch to Structure View", "border_clear"]

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
						signal: "component/uesio.runtime/TOGGLE_VIEW",
					},
				])}
				label={label}
				tooltipPlacement="right"
				icon={icon}
			/>
			<IconButton
				context={props.context}
				variant="io.large"
				label="View Detail"
				tooltipPlacement="left"
				icon="list"
				onClick={() => {
					const workspace = props.context.getWorkspace()
					const route = props.context.getRoute()
					if (!workspace || !route) {
						return
					}

					const [, viewName] = component.path.parseKey(route.view)

					uesio.signal.run(
						{
							signal: "route/REDIRECT",
							path: `/app/${workspace.app}/workspace/${workspace.name}/views/${viewName}`,
						},
						props.context
					)
				}}
			/>
		</ScrollPanel>
	)
}

TopLeftNav.displayName = "TopLeftNav"

export default TopLeftNav

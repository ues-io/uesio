import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

const IconButton = component.registry.getUtility("io.iconbutton")
const ScrollPanel = component.registry.getUtility("io.scrollpanel")

const RightNav: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context, className } = props
	const uesio = hooks.useUesio(props)
	const hasChanges = uesio.builder.useHasChanges()

	return (
		<ScrollPanel
			context={context}
			className={className}
			variant="studio.verticalnav"
		>
			<IconButton
				context={context}
				variant="io.large"
				label="Save"
				tooltipPlacement="left"
				disabled={!hasChanges}
				icon="save"
				onClick={() => {
					uesio.builder.save()
				}}
			/>
			<IconButton
				context={context}
				variant="io.large"
				label="Cancel"
				tooltipPlacement="left"
				disabled={!hasChanges}
				icon="cancel"
				onClick={() => {
					uesio.builder.cancel()
				}}
			/>
			<IconButton
				context={context}
				variant="io.large"
				label="Code"
				tooltipPlacement="left"
				disabled={!hasChanges}
				icon="code"
				onClick={uesio.signal.getHandler([
					{
						signal: "component/uesio.runtime/TOGGLE_CODE",
					},
				])}
			/>
			<IconButton
				context={context}
				variant="io.large"
				label="View Detail"
				tooltipPlacement="left"
				icon="listalt"
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
RightNav.displayName = "RightNav"
export default RightNav

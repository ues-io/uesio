import { CSSProperties, FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

const IconButton = component.registry.getUtility("io.iconbutton")
const ScrollPanel = component.registry.getUtility("io.scrollpanel")

interface Props extends definition.BaseProps {
	style?: CSSProperties
}

const RightNav: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const hasChanges = uesio.builder.useHasChanges()

	return (
		<ScrollPanel {...props} variant="studio.verticalnav">
			<IconButton
				{...props}
				variant="io.large"
				label="Save"
				disabled={!hasChanges}
				icon="save"
				onClick={() => {
					uesio.builder.save()
				}}
			/>
			<IconButton
				{...props}
				variant="io.large"
				label="Cancel"
				disabled={!hasChanges}
				icon="cancel"
				onClick={() => {
					uesio.builder.cancel()
				}}
			/>
			<IconButton
				{...props}
				variant="io.large"
				label="Code"
				disabled={!hasChanges}
				icon="code"
				onClick={uesio.signal.getHandler([
					{
						signal: "component/uesio.runtime/TOGGLE_CODE",
					},
				])}
			/>
			<IconButton
				{...props}
				variant="io.large"
				label="View Detial"
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
							path: `/app/${workspace.app}/workspace/${workspace.name}/view/${viewName}`,
						},
						props.context
					)
				}}
			/>
		</ScrollPanel>
	)
}

export default RightNav

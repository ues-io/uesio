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
		</ScrollPanel>
	)
}
RightNav.displayName = "RightNav"
export default RightNav

import { definition, styles, api, component, signal } from "@uesio/ui"

type SidePanelDefinition = {
	id?: string
}
const StyleDefaults = Object.freeze({
	inner: [],
	root: [],
	content: [],
	header: [],
	icon: [],
	blocker: [],
})

const Dialog: definition.UC<SidePanelDefinition> = (props) => {
	const { context, definition, path } = props
	const IOSidePanel = component.getUtility("uesio/io.sidepanel")
	const classes = styles.useStyleTokens(StyleDefaults, props)
	if (!definition) return null
	const panelId = definition?.id as string
	const onClose = api.signal.getHandler(
		[
			{
				signal: "panel/TOGGLE",
				panel: panelId,
			} as signal.SignalDefinition,
		],
		context
	)
	console.log("definition:", definition)
	return (
		<IOSidePanel
			onClose={onClose}
			context={context}
			classes={classes}
			variant={definition["uesio.variant"]}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={context}
				variant={definition["uesio.variant"]}
			/>
		</IOSidePanel>
	)
}
export default Dialog

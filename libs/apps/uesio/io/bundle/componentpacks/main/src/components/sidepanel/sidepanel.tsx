import { definition, api, component, signal, styles } from "@uesio/ui"

import { default as IOSidePanel } from "../../utilities/sidepanel/sidepanel"

type SidePanelDefinition = {
	id?: string
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Dialog: definition.UC<SidePanelDefinition> = (props) => {
	const { context, definition, path } = props
	if (!definition) return null
	const classes = styles.useStyleTokens(StyleDefaults, props)
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
	return (
		<IOSidePanel
			onClose={onClose}
			context={context}
			classes={classes}
			variant={definition[component.STYLE_VARIANT]}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={context}
			/>
		</IOSidePanel>
	)
}
export default Dialog

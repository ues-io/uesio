import { definition, api, component, signal, styles } from "@uesio/ui"

import { default as IOSidePanel } from "../../utilities/sidepanel/sidepanel"

type SidePanelDefinition = {
	id?: string
	closeOnOutsideClick?: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Dialog: definition.UC<SidePanelDefinition> = (props) => {
	const { context, definition, path, componentType } = props
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
			closeOnOutsideClick={definition.closeOnOutsideClick}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={context}
				componentType={componentType}
			/>
		</IOSidePanel>
	)
}
export default Dialog

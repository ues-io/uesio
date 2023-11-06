import { definition, api, component, signal, styles } from "@uesio/ui"

import { default as IODialog } from "../../utilities/dialog/dialog"

type DialogDefinition = {
	title?: string
	width?: string
	height?: string
	zIndex?: string
	id?: string
	afterClose?: signal.SignalDefinition[]
	actions?: definition.DefinitionList[]
	components?: definition.DefinitionList[]
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Dialog: definition.UC<DialogDefinition> = (props) => {
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
		<IODialog
			classes={classes}
			variant={definition[component.STYLE_VARIANT]}
			onClose={onClose}
			context={context}
			width={definition.width as string}
			zIndex={definition.zIndex as string}
			height={definition.height as string}
			title={definition.title as string}
			actions={
				definition.actions && (
					<component.Slot
						definition={definition}
						listName="actions"
						path={path}
						context={context}
					/>
				)
			}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={context}
			/>
		</IODialog>
	)
}
export default Dialog

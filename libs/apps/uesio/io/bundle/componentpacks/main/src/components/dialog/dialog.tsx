import { definition, api, component, signal } from "@uesio/ui"

import { default as IODialog } from "../../utilities/dialog/dialog"

type DialogDefinition = {
	title?: string
	width?: string
	height?: string
	id?: string
	afterClose?: signal.SignalDefinition[]
	actions?: definition.DefinitionList[]
	components?: definition.DefinitionList[]
}

const Dialog: definition.UC<DialogDefinition> = (props) => {
	const { context, definition, path } = props
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
	return (
		<IODialog
			onClose={onClose}
			context={context}
			width={definition.width as string}
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

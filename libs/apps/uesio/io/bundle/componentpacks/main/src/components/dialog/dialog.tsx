import { definition, api, component } from "@uesio/ui"

import { default as IODialog } from "../../utilities/dialog/dialog"

type DialogDefinition = {
	title?: string
	width?: string
	height?: string
	id?: string
}

const Dialog: definition.UC<DialogDefinition> = (props) => {
	const { context, definition, path } = props
	const panelId = definition?.id as string
	const onClose = api.signal.getHandler(
		[
			{
				signal: "panel/TOGGLE",
				panel: panelId,
			},
		],
		context
	)
	if (!definition) return null
	return (
		<IODialog
			onClose={onClose}
			context={context}
			width={definition.width as string | undefined}
			height={definition.height as string | undefined}
			title={definition.title as string | undefined}
			actions={
				<component.Slot
					definition={definition}
					listName="actions"
					path={path}
					context={context}
				/>
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

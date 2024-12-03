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
	closeOnOutsideClick?: boolean
	closed?: boolean
}

const Dialog: definition.UC<DialogDefinition> = (props) => {
	const { context, definition, path, componentType } = props
	if (!definition) return null

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
	return (
		<IODialog
			styleTokens={definition[component.STYLE_TOKENS]}
			variant={definition[component.STYLE_VARIANT]}
			onClose={onClose}
			context={context}
			closed={definition.closed}
			width={definition.width as string}
			height={definition.height as string}
			title={definition.title as string}
			closeOnOutsideClick={definition.closeOnOutsideClick}
			actions={
				definition.actions && (
					<component.Slot
						definition={definition}
						listName="actions"
						path={path}
						context={context}
						componentType={componentType}
					/>
				)
			}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={context}
				componentType={componentType}
			/>
		</IODialog>
	)
}

export type { DialogDefinition }
export default Dialog

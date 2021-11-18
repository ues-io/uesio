import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import { DialogUtilityProps } from "../../utility/io.dialog/dialog"

const IODialog = component.registry.getUtility<DialogUtilityProps>("io.dialog")

const Dialog: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition, path } = props
	const panelId = definition?.id as string
	const onClose = uesio.signal.getHandler([
		{
			signal: "panel/TOGGLE",
			panel: panelId,
		},
	])
	if (!definition) return null
	return (
		<IODialog
			onClose={onClose}
			context={context}
			width={definition.width as string | undefined}
			height={definition.height as string | undefined}
			title={definition.title as string | undefined}
			actions={
				definition?.actions && (
					<component.Slot
						definition={definition}
						listName="actions"
						path={path}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				)
			}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
			/>
		</IODialog>
	)
}

export default Dialog

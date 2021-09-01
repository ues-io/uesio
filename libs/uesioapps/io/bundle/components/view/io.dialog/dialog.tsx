import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"

const IODialog = component.registry.getUtility("io.dialog")

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

	// Dialogs are using the component name as key in the path,
	// This requires changing for the component slots.
	const slotPathArray = [
		...component.path.pathArray(path || "").slice(0, -1),
		definition?.id,
	] as string[]

	return (
		<IODialog
			onClose={onClose}
			context={context}
			width={definition?.width}
			height={definition?.height}
			title={definition?.title}
			actions={
				definition?.actions && (
					<component.Slot
						definition={definition}
						listName="actions"
						path={component.path.fromPath(slotPathArray)}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				)
			}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={component.path.fromPath(slotPathArray)}
				accepts={["uesio.standalone"]}
				context={context}
			/>
		</IODialog>
	)
}

export default Dialog

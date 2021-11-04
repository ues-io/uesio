import { FunctionComponent, useRef } from "react"
import { definition, component } from "@uesio/ui"

const IODialogPlain = component.registry.getUtility("io.dialogplain")

const PlainDialog: FunctionComponent<definition.BaseProps> = (props) => {
	const ref = useRef<HTMLDivElement>(null)
	return (
		<IODialogPlain ref={ref} context={props.context}>
			<component.Slot
				parentRef={ref}
				definition={props.definition}
				listName="components"
				path={props.path}
				accepts={["uesio.standalone"]}
				context={props.context}
			/>
		</IODialogPlain>
	)
}

export default PlainDialog

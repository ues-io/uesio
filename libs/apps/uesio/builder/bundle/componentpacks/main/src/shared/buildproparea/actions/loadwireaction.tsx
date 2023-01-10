import { FunctionComponent } from "react"
import { api, component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const LoadWireAction: FunctionComponent<ActionProps> = (props) => {
	const { path, context } = props
	const wireName = component.path.getKeyAtPath(path || "")
	const viewId = context.getViewDefId()
	if (!viewId) throw new Error("No View Id provided")

	const viewDef = api.view.getViewDef(context.getViewDefId() || "")

	if (!wireName) {
		return null
	}

	return (
		<ActionButton
			disabled={!Object.keys(viewDef?.wires || {}).length}
			title="Refresh Wire"
			onClick={api.signal.getHandler(
				[
					{
						signal: "wire/INIT",
						wireDefs: [wireName],
					},
					{
						signal: "wire/LOAD",
						wires: [wireName],
					},
				],
				context
			)}
			icon="refresh"
			context={context}
		/>
	)
}

export default LoadWireAction

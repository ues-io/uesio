import { FunctionComponent } from "react"
import { hooks, component, styles } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import isEqual from "lodash/isEqual"
import { pick } from "lodash"

const LoadWireAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path, action, context } = props
	const wireName = component.path.getKeyAtPath(path || "")
	const viewId = context.getViewDefId()
	if (!viewId) throw new Error("No View Id provided")

	const viewDef = uesio.view.getViewDef(context.getViewDefId() || "")
	const wire = uesio.wire.useWire(wireName || "")
	const wireDef = viewDef?.wires?.[wireName || ""]

	const valuesToCompare = [
		"conditions",
		"order",
		"collection",
		"fields",
		"collection",
	]

	const wirePick = pick(wire?.source, valuesToCompare)
	const wireDefPick = pick(wireDef, valuesToCompare)
	const classes = styles.useUtilityStyles(
		{
			root: {
				color: isEqual(wireDefPick, wirePick) ? "inherit" : "#FF5E2F",
			},
		},
		props
	)

	if (!action || !wireName) {
		return null
	}

	return (
		<ActionButton
			disabled={!Object.keys(viewDef?.wires || {}).length}
			className={classes.root}
			title="Refresh Wire"
			onClick={uesio.signal.getHandler([
				{
					signal: "wire/INIT",
					wireDefs: viewDef?.wires || {},
				},
				{
					signal: "wire/LOAD",
					wires: [wireName],
				},
			])}
			icon="refresh"
			context={context}
		/>
	)
}

export default LoadWireAction

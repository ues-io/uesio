import { FC } from "react"
import { component, definition, hooks, styles, signal, wire } from "@uesio/ui"
import { ActionsBarDefinition, Action } from "./actionsbardefinition"

interface T extends definition.UtilityProps {
	definition: ActionsBarDefinition
	actions: Action[]
	// wire: wire.Wire
}

const IOButton = component.registry.getUtility("io.button")

const ActionsBar: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition, wire } = props
	const classes = styles.useStyles(
		{
			root: {
				flex: "100%",
				order: definition.actionsBarPosition === "top" ? -1 : "initial",
				display: "inline-flex",
				gap: "5px",
			},
			buttonGroup: {},
		},
		props
	)

	const fireSignals = (signals: signal.SignalDefinition[]) => {
		const [handler] = uesio.signal.useHandler(signals)
		handler && handler()
	}
	const wireHasChanges =
		wire && Object.keys(Object.values(wire.source.changes)[0]).length !== 0

	return (
		<div className={classes.root}>
			{props.actions.map(({ name, signals }) => (
				<IOButton
					variant={definition.buttonVariant}
					label={name.charAt(0).toUpperCase() + name.slice(1)}
					onClick={() => fireSignals(signals)}
					disabled={name === "save" && !wireHasChanges}
					context={context}
				/>
			))}
		</div>
	)
}

export default ActionsBar

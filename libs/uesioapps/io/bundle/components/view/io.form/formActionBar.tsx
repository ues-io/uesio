import { FC } from "react"
import { component, definition, hooks, styles, signal, wire } from "@uesio/ui"
import { FormDefinition, FormAction } from "./formdefinition"

const IOButton = component.registry.getUtility("io.button")
interface T extends definition.BaseProps {
	definition: FormDefinition
	wire: wire.Wire
}

type Signals = {
	[key in FormAction]: signal.SignalDefinition[]
}

const FormActionsBar: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition, wire } = props
	const { wire: wireId, defaultButtons, id, actionsBarPosition } = definition

	const signals: Signals = {
		save: [
			{ signal: "wire/SAVE", wires: [wireId] },
			{
				signal: "notification/ADD",
				text: "saved",
			},
			{ signal: "wire/EMPTY", wireId },
			{ signal: "wire/CREATE_RECORD", wireId },
		],
		edit: [{ signal: "component/io.form/TOGGLE_MODE", target: id }],
		cancel: [{ signal: "wire/CANCEL", wireId }],
		delete: [
			{ signal: "wire/MARK_FOR_DELETE", wireId },
			{ signal: "wire/SAVE", wireId },
		],
	}

	const classes = styles.useStyles(
		{
			root: {
				textAlign: "right",
				flex: "100%",
				order: actionsBarPosition === "top" ? -1 : "initial",
			},
			buttonGroup: {
				display: "inline-flex",
				gap: "5px",
			},
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
			<div className={classes.buttonGroup}>
				{defaultButtons?.map((text) => (
					<IOButton
						variant={definition.buttonVariant}
						label={text.charAt(0).toUpperCase() + text.slice(1)}
						onClick={() => fireSignals(signals[text])}
						disabled={text === "save" && !wireHasChanges}
						context={context}
					/>
				))}
			</div>
		</div>
	)
}

export default FormActionsBar

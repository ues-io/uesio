import { FC } from "react"
import { component, definition, hooks, styles, signal } from "@uesio/ui"
import { FormDefinition } from "./formdefinition"

const IOButton = component.registry.getUtility("io.button")
interface T extends definition.BaseProps {
	definition: FormDefinition
}

type Signals = {
	save: signal.SignalDefinition[]
	delete: signal.SignalDefinition[]
	cancel: signal.SignalDefinition[]
	edit: signal.SignalDefinition[]
}

const FormActionsBar: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition } = props
	const { wire, defaultButtons, id, actionsBarPosition } = definition

	const signals: Signals = {
		save: [
			{ signal: "wire/SAVE", wires: [wire] },
			{
				signal: "notification/ADD",
				text: "saved",
			},
			{ signal: "wire/EMPTY", wire },
			{ signal: "wire/CREATE_RECORD", wire },
		],
		edit: [{ signal: "component/io.form/TOGGLE_MODE", target: id }],
		cancel: [{ signal: "wire/CANCEL", wire }],
		delete: [
			{ signal: "wire/MARK_FOR_DELETE", wire },
			{ signal: "wire/SAVE", wire },
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

	const Wire = context.getWire()
	const wireHasChanges = false
	// const wireHasChanges =
	// 	Wire && Object.keys(Object.values(Wire.source.changes)[0]).length !== 0
	const disableChecks = {
		save: !wireHasChanges, // Disable Save button when wire has no changes
		cancel: !wireHasChanges, // Disable Save button when wire has no changes
		edit: false,
		delete: false,
	}

	return (
		<div className={classes.root}>
			<div className={classes.buttonGroup}>
				{defaultButtons?.map((text) => (
					<IOButton
						variant={definition.buttonVariant}
						label={text.charAt(0).toUpperCase() + text.slice(1)}
						onClick={() => fireSignals(signals[text])}
						disabled={disableChecks[text]}
						context={context}
					/>
				))}
			</div>
		</div>
	)
}

export default FormActionsBar

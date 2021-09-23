import { FC } from "react"
import {
	builder,
	component,
	definition,
	hooks,
	styles,
	signal,
} from "@uesio/ui"
import FormSection from "../io.formsection/formsection"
import { FormDefinition } from "./formdefinition"
import { defaultTo } from "lodash"

const FieldLabel = component.registry.getUtility("io.fieldlabel")
const IOButton = component.registry.getUtility("io.button")
const IOFormSection = component.registry.getUtility("io.formsection")

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
	const { path, context, definition } = props
	const { wire, template, defaultButtons, id } = definition

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
		delete: [{ signal: "wire/CANCEL", wire }],
	}

	const classes = styles.useStyles(
		{
			root: {
				textAlign: "right",
				flex: "100%",
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

	return (
		<div className={classes.root}>
			<div className={classes.buttonGroup}>
				{defaultButtons?.map((text) => (
					<IOButton
						variant={definition.buttonVariant}
						label={text.charAt(0).toUpperCase() + text.slice(1)}
						onClick={() => fireSignals(signals[text])}
						context={context}
					/>
				))}
			</div>
		</div>
	)
}

export default FormActionsBar

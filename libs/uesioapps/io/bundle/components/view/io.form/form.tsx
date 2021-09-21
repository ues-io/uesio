import { FC, createContext } from "react"
import { component, styles, hooks, signal } from "@uesio/ui"
import { FormProps } from "./formdefinition"
import Layout from "../io.layout/layout"
export const FormStylesContext = createContext({})

type ListMode = "READ" | "EDIT"

type ListState = {
	mode: ListMode
}

const IOTitleBar = component.registry.getUtility("io.titlebar")
const IOButton = component.registry.getUtility("io.button")

const Form: FC<FormProps> = (props) => {
	const { definition, context, path } = props
	const {
		defaultActionsBar,
		actionsBarPosition,
		wire: wireName,
		title,
		subtitle,
		id,
		mode,
	} = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(wireName)

	const classes = styles.useStyles(
		{
			root: {
				display: "block",
			},
			formArea: {
				marginBottom: "1em",
			},
			actionsBar: {
				textAlign: "right",
			},
		},
		props
	)

	// If we got a wire from the definition, add it to context
	const newContext = wireName
		? context.addFrame({
				wire: wireName,
		  })
		: context

	const [componentState] = uesio.component.useState<ListState>(id, {
		mode: mode || "READ",
	})

	const signals: signal.SignalDefinition[] = [
		{ signal: "wire/SAVE", wires: [wireName] },
		{
			signal: "notification/ADD",
			text: "successfully submitted",
		},
		{ signal: "wire/EMPTY", wire: wireName },
		{ signal: "wire/CREATE_RECORD", wire: wireName },
	]
	const [handler, portals] = uesio.signal.useHandler(signals)

	const data = wire?.getData()

	const showActionsBar = {
		top: defaultActionsBar && actionsBarPosition === "top",
		bottom: defaultActionsBar && actionsBarPosition === "bottom",
	}

	const ActionsBar: FC = () => (
		<div className={classes.actionsBar}>
			<IOButton
				// classes={classes}
				label={"Submit"}
				variant={definition["uesio.variant"]}
				onClick={() => handler && handler()}
				context={context}
			/>
			{portals}
		</div>
	)

	return wire && data ? (
		<div>
			<IOTitleBar
				context={context}
				variant={definition["uesio.variant"]}
				title={title}
				subtitle={subtitle}
				actions={
					<component.Slot
						definition={definition}
						listName="actions"
						path={path}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				}
			/>

			<div className="formArea">
				{/* {showActionsBar.top && <ActionsBar />} */}

				{data.map((record) => (
					<component.Slot
						definition={definition}
						listName="sections"
						path={path}
						accepts={["io.formsection"]}
						context={newContext.addFrame({
							record: record.getId(),
							fieldMode: componentState?.mode,
						})}
					/>
				))}
				{showActionsBar.bottom && <ActionsBar />}
			</div>
		</div>
	) : (
		<div>
			<p>
				{!wire
					? "please select a wire"
					: !data && "no data in the wire"}
			</p>
		</div>
	)
}

export default Form

import { FC, createContext } from "react"
import { component, styles, hooks, signal } from "@uesio/ui"
import { FormProps } from "./formdefinition"
import ActionsBar from "./formActionBar"
export const FormStylesContext = createContext({})

type ListMode = "READ" | "EDIT"

type ListState = {
	mode: ListMode
}

const IOTitleBar = component.registry.getUtility("io.titlebar")

const Form: FC<FormProps> = (props) => {
	const { definition, context, path } = props
	const {
		defaultActionsBar,
		actionsBarPosition,
		wire: wireName,
		title,
		subtitle,
		defaultButtons,
		id,
		columnGap,
		mode,
	} = definition
	const uesio = hooks.useUesio(props)
	const wire = wireName ? uesio.wire.useWire(wireName) : context.getWire()

	const classes = styles.useStyles(
		{
			root: {
				display: "block",
			},
			formArea: {
				marginBottom: "1em",
				flexFlow: "row wrap",
				gap: columnGap,
				display: "flex",
			},
			formRow: {
				flex: "100%",
				gap: "inherit",
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

	const [componentState] = uesio.component.useState<ListState>(
		definition.id,
		{
			mode: definition.mode || "READ",
		}
	)

	const data = wire?.getData()

	const showActionsBar = {
		top: defaultActionsBar && actionsBarPosition === "top",
		bottom: defaultActionsBar && actionsBarPosition === "bottom",
	}

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

			<div className={classes.formArea}>
				{defaultButtons.length && showActionsBar.top && (
					<ActionsBar {...props} />
				)}

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
				{defaultButtons.length && showActionsBar.bottom && (
					<ActionsBar {...props} />
				)}
			</div>
		</div>
	) : (
		<div />
	)
}

export default Form

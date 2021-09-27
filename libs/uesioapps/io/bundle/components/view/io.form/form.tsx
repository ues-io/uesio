import { FC, createContext } from "react"
import { component, styles, hooks, signal } from "@uesio/ui"
import { FormProps, FormState } from "./formdefinition"
import ActionsBar from "./formActionBar"
export const FormStylesContext = createContext({})

const IOTitleBar = component.registry.getUtility("io.titlebar")

const Form: FC<FormProps> = (props) => {
	const { definition, context, path } = props
	const {
		wire: wireName,
		title,
		subtitle,
		defaultButtons,
		columnGap,
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

	// If we receive a wire from the definition, add it to context
	const newContext = wireName
		? context.addFrame({
				wire: wireName,
		  })
		: context

	const [componentState] = uesio.component.useState<FormState>(
		definition.id,
		{
			mode: definition.mode || "READ",
		}
	)

	const data = wire?.getData()

	return wire && data ? (
		<div>
			<IOTitleBar
				context={context}
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

			{data.map((record) => (
				<form className={classes.formArea}>
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
					{defaultButtons.length && (
						<ActionsBar
							{...props}
							wire={wire}
							context={newContext.addFrame({
								record: record.getId(),
								fieldMode: componentState?.mode,
							})}
						/>
					)}
				</form>
			))}
		</div>
	) : (
		<div />
	)
}

export default Form

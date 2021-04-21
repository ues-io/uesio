import { FunctionComponent } from "react"
import { definition, hooks, component, styles } from "@uesio/ui"
import { DialogBase } from "../io.dialogplain/dialogplain"

const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")
const Grid = component.registry.getUtility("io.grid")
const Group = component.registry.get("io.group")

const Dialog: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				gridTemplateRows: "auto 1fr auto",
				height: "100%",
			},
			content: {
				padding: "20px",
				overflow: "auto",
			},
		},
		props
	)
	const uesio = hooks.useUesio(props)
	const panelId = props.definition?.id as string
	return (
		<DialogBase {...props}>
			<Grid className={classes.root} context={props.context}>
				<TitleBar
					title={props.definition?.title}
					variant="io.dialog"
					context={props.context}
					actions={
						<IconButton
							icon="close"
							onClick={uesio.signal.getHandler([
								{
									signal: "panel/TOGGLE",
									panel: panelId,
								},
							])}
							context={props.context}
						/>
					}
				/>
				<div className={classes.content}>
					<component.Slot
						definition={props.definition}
						listName="components"
						path={props.path}
						accepts={["uesio.standalone"]}
						context={props.context}
					/>
				</div>
				{props.definition?.actions && (
					<Group
						context={props.context}
						definition={{
							components: props.definition?.actions,
							"uesio.styles": {
								root: {
									justifyContent: "end",
									padding: "20px",
								},
							},
						}}
					/>
				)}
			</Grid>
		</DialogBase>
	)
}

export default Dialog

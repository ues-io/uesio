import { FunctionComponent, ReactNode } from "react"
import { definition, styles, component } from "@uesio/ui"

const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")
const Grid = component.registry.getUtility("io.grid")
const Group = component.registry.getUtility("io.group")
const IODialogPlain = component.registry.getUtility("io.dialogplain")

interface DialogProps extends definition.UtilityProps {
	onClose?: () => void
	width?: string
	height?: string
	title?: string
	actions?: ReactNode
}

const Dialog: FunctionComponent<DialogProps> = (props) => {
	const classes = styles.useUtilityStyles(
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
	const { context, title, onClose, width, height, children, actions } = props
	return (
		<IODialogPlain
			context={props.context}
			height={height}
			width={width}
			onClose={onClose}
		>
			<Grid className={classes.root} context={context}>
				<TitleBar
					title={title}
					variant="io.dialog"
					context={context}
					actions={
						<IconButton
							icon="close"
							onClick={onClose}
							context={context}
						/>
					}
				/>
				<div className={classes.content}>{children}</div>
				<Group
					styles={{
						root: {
							justifyContent: "end",
							padding: "20px",
						},
					}}
					context={context}
				>
					{actions}
				</Group>
			</Grid>
		</IODialogPlain>
	)
}

export default Dialog

import { FunctionComponent, ReactNode } from "react"
import { definition, styles, component } from "@uesio/ui"
import { GroupUtilityProps } from "../group/group"
import { DialogPlainUtilityProps } from "../dialogplain/dialogplain"
import { IconButtonUtilityProps } from "../iconbutton/iconbutton"

const TitleBar = component.getUtility("uesio/io.titlebar")
const IconButton = component.getUtility<IconButtonUtilityProps>(
	"uesio/io.iconbutton"
)
const Grid = component.getUtility("uesio/io.grid")
const Group = component.getUtility<GroupUtilityProps>("uesio/io.group")
const IODialogPlain = component.getUtility<DialogPlainUtilityProps>(
	"uesio/io.dialogplain"
)

interface DialogUtilityProps extends definition.UtilityProps {
	onClose?: () => void
	width?: string
	height?: string
	title?: string
	actions?: ReactNode
}

const Dialog: FunctionComponent<DialogUtilityProps> = (props) => {
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
					variant="uesio/io.dialog"
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
export { DialogUtilityProps }

export default Dialog

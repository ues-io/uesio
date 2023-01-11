import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import DialogPlain from "../dialogplain/dialogplain"
import Grid from "../grid/grid"
import TitleBar from "../titlebar/titlebar"
import IconButton from "../iconbutton/iconbutton"
import Group from "../group/group"

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
		<DialogPlain
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
		</DialogPlain>
	)
}
export { DialogUtilityProps }

export default Dialog

import { ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import DialogPlain from "../dialogplain/dialogplain"
import TitleBar from "../titlebar/titlebar"
import IconButton from "../iconbutton/iconbutton"
import Group from "../group/group"

interface DialogUtilityProps {
	onClose?: () => void
	width?: string
	height?: string
	title?: string
	actions?: ReactNode
}

const StyleDefaults = Object.freeze({
	blocker: [],
	wrapper: [],
	root: [],
	inner: [],
	content: [],
	footer: [],
})

const Dialog: definition.UtilityComponent<DialogUtilityProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.dialog"
	)
	const { context, title, onClose, width, height, children, actions } = props
	return (
		<DialogPlain
			context={props.context}
			height={height}
			width={width}
			onClose={onClose}
			initialFocus={1}
			classes={{
				blocker: classes.blocker,
			}}
		>
			<div className={classes.root}>
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
				{actions && (
					<Group className={classes.footer} context={context}>
						{actions}
					</Group>
				)}
			</div>
		</DialogPlain>
	)
}

export default Dialog

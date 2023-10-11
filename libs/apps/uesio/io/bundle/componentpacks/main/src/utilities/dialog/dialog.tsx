import { ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import DialogPlain from "../dialogplain/dialogplain"
import Grid from "../grid/grid"
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
	root: ["grid-rows-[auto_1fr_auto]", "h-full"],
	content: ["p-5", "overflow-auto"],
	footer: ["p-5", "justify-end"],
})

const Dialog: definition.UtilityComponent<DialogUtilityProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	const { context, title, onClose, width, height, children, actions } = props
	return (
		<DialogPlain
			context={props.context}
			height={height}
			width={width}
			onClose={onClose}
			initialFocus={1}
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
				{actions && (
					<Group className={classes.footer} context={context}>
						{actions}
					</Group>
				)}
			</Grid>
		</DialogPlain>
	)
}

export default Dialog

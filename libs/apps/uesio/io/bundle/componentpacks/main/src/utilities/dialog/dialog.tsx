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
	zIndex: string
	height?: string
	title?: string
	actions?: ReactNode
}

const StyleDefaults = Object.freeze({
	root: [],
	content: [],
	footer: [],
})

const Dialog: definition.UtilityComponent<DialogUtilityProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.dialog"
	)
	const {
		context,
		title,
		onClose,
		width,
		zIndex,
		height,
		children,
		actions,
	} = props

	return (
		<DialogPlain
			context={props.context}
			height={height}
			width={width}
			zIndex={zIndex}
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

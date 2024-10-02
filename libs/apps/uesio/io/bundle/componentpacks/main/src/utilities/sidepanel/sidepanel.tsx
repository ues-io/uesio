import { definition, styles } from "@uesio/ui"
import SidePanelPlain from "../sidepanelplain/sidepanelplain"
import Grid from "../grid/grid"
import IconButton from "../iconbutton/iconbutton"

interface SidePanelUtilityProps {
	onClose?: () => void
	closeOnOutsideClick?: boolean
	closed?: boolean
}

const StyleDefaults = Object.freeze({
	content: [],
	header: [],
	icon: [],
})

const SidePanel: definition.UtilityComponent<SidePanelUtilityProps> = (
	props
) => {
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.sidepanel"
	)
	const { context, onClose, children, closeOnOutsideClick } = props
	return (
		<SidePanelPlain
			context={context}
			onClose={onClose}
			closed={closed}
			initialFocus={1}
			closeOnOutsideClick={closeOnOutsideClick}
			variant={props.variant}
			styleTokens={props.styleTokens}
		>
			<Grid context={context}>
				<div className={classes.header}>
					<IconButton
						className={classes.icon}
						icon="close"
						onClick={onClose}
						context={context}
					/>
				</div>
				<div className={classes.content}>{children}</div>
			</Grid>
		</SidePanelPlain>
	)
}

export default SidePanel

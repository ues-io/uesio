import { definition, styles } from "@uesio/ui"
import SidePanelPlain from "../sidepanelplain/sidepanelplain"
import Grid from "../grid/grid"
import IconButton from "../iconbutton/iconbutton"

interface SidePanelUtilityProps {
	onClose?: () => void
}

const StyleDefaults = Object.freeze({
	root: [],
	content: ["p-4"],
	header: ["text-right"],
	icon: ["text-2xl", "m-2", "p-1"],
})

const SidePanel: definition.UtilityComponent<SidePanelUtilityProps> = (
	props
) => {
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	const { context, onClose, children } = props
	return (
		<SidePanelPlain
			context={props.context}
			onClose={onClose}
			initialFocus={1}
		>
			<Grid className={classes.root} context={context}>
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

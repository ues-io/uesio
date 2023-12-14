import { styles, definition } from "@uesio/ui"
import { ReactNode } from "react"

const StyleDefaults = Object.freeze({
	root: [],
	logo: [],
	content: [],
	left: [],
	center: [],
	right: [],
	avatar: [],
})

type ViewHeaderProps = {
	logo?: ReactNode
	left?: ReactNode
	center?: ReactNode
	right?: ReactNode
	avatar?: ReactNode
}

const ViewHeader: definition.UtilityComponent<ViewHeaderProps> = (props) => {
	const { logo, left, center, right, avatar } = props

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.viewheader"
	)
	return (
		<div className={classes.root}>
			<div className={classes.logo}>{logo}</div>
			<div className={classes.content}>
				<div className={classes.left}>{left}</div>
				<div className={classes.center}>{center}</div>
				<div className={classes.right}>{right}</div>
			</div>
			<div className={classes.avatar}>{avatar}</div>
		</div>
	)
}

export default ViewHeader

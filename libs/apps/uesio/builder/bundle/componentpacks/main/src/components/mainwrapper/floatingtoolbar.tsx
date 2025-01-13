import { definition, styles } from "@uesio/ui"
import MainHeader from "./mainheader"

const StyleDefaults = Object.freeze({
	root: ["absolute", "p-2", "right-0", "bottom-0"],
})

const FloatingToolbar: definition.UtilityComponent = (props) => {
	const { context } = props

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	return (
		<div className={classes.root}>
			<MainHeader context={context} />
		</div>
	)
}

export default FloatingToolbar

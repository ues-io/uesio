import { definition, styles } from "@uesio/ui"
import MainHeader from "./mainheader"

const StyleDefaults = Object.freeze({
	root: [
		"absolute",
		"p-2",
		"right-0",
		"bottom-0",
		"m-3",
		"shadow-[0_0px_3px_0_rgb(0_0_0_/_0.1),_0_1px_2px_-1px_rgb(0_0_0_/_0.1),0_4px_6px_-1px_rgb(0_0_0_/_0.1)]",
		"bg-white",
		"rounded-md",
	],
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

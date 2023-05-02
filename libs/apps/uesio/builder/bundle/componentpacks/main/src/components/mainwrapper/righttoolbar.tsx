import { definition, component, styles, hooks, api } from "@uesio/ui"
import DeviceSizer from "./devicesizer"

const StyleDefaults = Object.freeze({
	root: ["w-9", "grid", "gap-2", "auto-rows-min"],
	panel: ["grid", "justify-center"],
})

const RightToolbar: definition.UtilityComponent = (props) => {
	const { context } = props
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const toggleCode = api.signal.getHandler(
		[
			{
				signal: "component/CALL",
				component: "uesio/builder.mainwrapper",
				componentsignal: "TOGGLE_CODE",
			},
		],
		context
	)

	hooks.useHotKeyCallback("meta+y", () => {
		toggleCode?.()
	})

	return (
		<div className={classes.root}>
			<div className={classes.panel}>
				<Button
					context={context}
					label=""
					icon={<Icon context={context} icon="code" />}
					variant="uesio/builder.minoricontoolbar"
					onClick={toggleCode}
				/>
			</div>
			<div className={classes.panel}>
				<DeviceSizer context={context} />
			</div>
		</div>
	)
}

export default RightToolbar

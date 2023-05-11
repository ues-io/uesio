import { definition, component, styles, hooks, api } from "@uesio/ui"
import DeviceSizer from "./devicesizer"

const StyleDefaults = Object.freeze({
	root: ["w-9", "grid", "gap-4", "auto-rows-min"],
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

	const toggleIndex = api.signal.getHandler(
		[
			{
				signal: "component/CALL",
				component: "uesio/builder.mainwrapper",
				componentsignal: "TOGGLE_INDEX",
			},
		],
		context
	)

	const toggleSlotTags = api.signal.getHandler(
		[
			{
				signal: "component/CALL",
				component: "uesio/builder.mainwrapper",
				componentsignal: "TOGGLE_SLOT_TAGS",
			},
		],
		context
	)

	hooks.useHotKeyCallback("meta+y", () => {
		toggleCode?.()
	})

	hooks.useHotKeyCallback("meta+i", () => {
		toggleIndex?.()
	})

	hooks.useHotKeyCallback("meta+e", () => {
		toggleSlotTags?.()
	})

	return (
		<div className={classes.root}>
			<div className={classes.panel}>
				<Button
					context={context}
					label=""
					icon={
						<Icon
							context={context}
							fill={false}
							icon="account_tree"
						/>
					}
					variant="uesio/builder.minoricontoolbar"
					onClick={toggleIndex}
					tooltip="Toggle Index Panel ⌘I"
					tooltipPlacement="left"
				/>
				<Button
					context={context}
					label=""
					icon={<Icon context={context} icon="code" />}
					variant="uesio/builder.minoricontoolbar"
					onClick={toggleCode}
					tooltip="Toggle Code Panel ⌘Y"
					tooltipPlacement="left"
				/>
			</div>
			<div className={classes.panel}>
				<DeviceSizer context={context} />
			</div>
			<div className={classes.panel}>
				<Button
					context={context}
					label=""
					icon={<Icon context={context} icon="expand" />}
					variant="uesio/builder.minoricontoolbar"
					onClick={toggleSlotTags}
					tooltip="Expand Slots ⌘E"
					tooltipPlacement="left"
				/>
			</div>
		</div>
	)
}

export default RightToolbar

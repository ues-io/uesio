import { definition, component, api, hooks } from "@uesio/ui"

const HeaderActions: definition.UtilityComponent = (props) => {
	const { context } = props
	const Group = component.getUtility("uesio/io.group")
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")

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
		<Group alignItems="right" context={context}>
			<Button
				context={context}
				label=""
				icon={<Icon weight={300} context={context} icon="code" />}
				variant="uesio/builder.minoricontoolbar"
				onClick={toggleCode}
			/>
		</Group>
	)
}

export default HeaderActions

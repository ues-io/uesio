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
				context={props.context}
				label=""
				icon={<Icon weight={200} context={context} icon="wysiwyg" />}
				variant="uesio/builder.minoricontoolbar"
				onClick={() => {
					api.signal.run(
						{ signal: "route/REDIRECT_TO_VIEW_CONFIG" },
						props.context
					)
				}}
			/>
			<Button
				context={props.context}
				label=""
				icon={<Icon weight={200} context={context} icon="view_quilt" />}
				variant="uesio/builder.minoricontoolbar"
				onClick={() => {
					const workspace = props.context.getWorkspace()
					if (!workspace) {
						return
					}

					api.signal.run(
						{
							signal: "route/REDIRECT",
							path: `/app/${workspace.app}/workspace/${workspace.name}/views`,
						},
						props.context
					)
				}}
			/>
			<Button
				context={context}
				label=""
				icon={<Icon weight={200} context={context} icon="code" />}
				variant="uesio/builder.minoricontoolbar"
				onClick={toggleCode}
			/>
		</Group>
	)
}

export default HeaderActions

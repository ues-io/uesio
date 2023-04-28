import { definition, component, api } from "@uesio/ui"

const HeaderCrumbs: definition.UtilityComponent = (props) => {
	const { context } = props
	const Group = component.getUtility("uesio/io.group")
	const Tile = component.getUtility("uesio/io.tile")

	const viewName = context.getViewDefId()

	return (
		<Group context={context}>
			<Tile
				context={context}
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
				variant="uesio/io.tag"
				className="py-1"
			>
				Views
			</Tile>
			<Tile
				context={context}
				onClick={() => {
					api.signal.run(
						{ signal: "route/REDIRECT_TO_VIEW_CONFIG" },
						props.context
					)
				}}
				variant="uesio/io.tag"
				className="py-1"
			>
				{viewName}
			</Tile>
		</Group>
	)
}

export default HeaderCrumbs

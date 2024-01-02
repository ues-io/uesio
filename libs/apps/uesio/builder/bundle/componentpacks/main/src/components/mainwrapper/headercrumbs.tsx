import { definition, component } from "@uesio/ui"
import { getBuilderNamespace } from "../../api/stateapi"

const HeaderCrumbs: definition.UtilityComponent = (props) => {
	const { context } = props
	const Group = component.getUtility("uesio/io.group")

	const workspace = context.getWorkspace()
	if (!workspace) throw new Error("No Workspace Context Provided")
	const viewKey = context.getViewDefId()

	const [viewNamespace, viewName] = component.path.parseKey(viewKey || "")

	const itemNSInfo = getBuilderNamespace(context, viewNamespace)

	return (
		<Group context={context} variant="uesio/builder.crumbsbox">
			<component.Component
				componentType={"uesio/builder.icontile"}
				path=""
				definition={{
					title: workspace.name,
					icon: "handyman",
					signals: [
						{
							signal: "route/NAVIGATE",
							path: `/app/${workspace.app}/workspace/${workspace.name}`,
							namespace: "uesio/studio",
						},
					],
				}}
				context={context.deleteWorkspace()}
			/>
			<component.Component
				componentType={"uesio/builder.icontile"}
				path=""
				definition={{
					title: "views",
					icon: "view_quilt",
					signals: [
						{
							signal: "route/NAVIGATE",
							path: `/app/${workspace.app}/workspace/${workspace.name}/views`,
							namespace: "uesio/studio",
						},
					],
				}}
				context={context.deleteWorkspace()}
			/>
			<component.Component
				componentType={"uesio/builder.icontile"}
				path=""
				definition={{
					title: viewName,
					icon: itemNSInfo?.icon,
					iconcolor: itemNSInfo?.color,
					signals: [
						{
							signal: "route/NAVIGATE",
							path: `/app/${workspace.app}/workspace/${workspace.name}/views/${viewNamespace}/${viewName}`,
							namespace: "uesio/studio",
						},
					],
				}}
				context={context.deleteWorkspace()}
			/>
		</Group>
	)
}

export default HeaderCrumbs

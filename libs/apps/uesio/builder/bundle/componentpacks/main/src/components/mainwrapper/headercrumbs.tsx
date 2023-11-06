import { definition, component } from "@uesio/ui"
import { getBuilderNamespace } from "../../api/stateapi"

const HeaderCrumbs: definition.UtilityComponent = (props) => {
	const { context } = props
	const Group = component.getUtility("uesio/io.group")

	const workspace = context.getWorkspace()
	if (!workspace) throw new Error("No Workspace Context Provided")

	const viewKey = context.getViewDefId()
	const nsInfo = getBuilderNamespace(context, workspace.app)

	const [viewNamespace, viewName] = component.path.parseKey(viewKey || "")

	return (
		<Group context={context}>
			<component.Component
				componentType={"uesio/io.icontile"}
				path=""
				definition={{
					title: workspace.app,
					icon: nsInfo?.icon,
					iconcolor: nsInfo?.color,
					signals: [
						{
							signal: "route/NAVIGATE",
							path: `/app/${workspace.app}`,
							namespace: "uesio/studio",
						},
					],
				}}
				context={context.deleteWorkspace()}
			/>
			<component.Component
				componentType={"uesio/io.icontile"}
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
				componentType={"uesio/io.icontile"}
				path=""
				definition={{
					title: "Views",
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
				componentType={"uesio/io.icontile"}
				path=""
				definition={{
					title: viewName,
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

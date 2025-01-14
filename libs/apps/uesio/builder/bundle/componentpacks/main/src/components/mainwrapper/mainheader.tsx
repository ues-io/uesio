import { api, definition, component, styles } from "@uesio/ui"

import { getBuilderNamespace } from "../../api/stateapi"
import SaveCancelArea from "./savecancelarea"

// Yes, navigator.platform is deprecated, but according to MDN in 2023
// it's still the least bad way to detect what meta key means
// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples
export const metaKey =
	navigator.platform.indexOf("Mac") === 0 || navigator.platform === "iPhone"
		? "⌘" // Command
		: "^" // Ctrl

const StyleDefaults = Object.freeze({
	linkButton: ["w-8", "h-8", "rounded", "bg-slate-100", "text-slate-600"],
})

const MainHeader: definition.UtilityComponent = (props) => {
	const { context } = props
	const IOImage = component.getUtility("uesio/io.image")
	const IOGroup = component.getUtility("uesio/io.group")
	const IOButton = component.getUtility("uesio/io.button")
	const Tile = component.getUtility("uesio/io.tile")
	const Avatar = component.getUtility("uesio/io.avatar")

	const viewKey = context.getViewDefId()

	const [viewNamespace, viewName] = component.path.parseKey(viewKey || "")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const workspace = context.getWorkspace()
	if (!workspace) throw new Error("No Workspace Context Provided")
	const nsInfo = getBuilderNamespace(context, workspace.app)

	const [homeLogoLink, homeLogoOnClick] = api.signal.useLinkHandler(
		[
			{
				// Have to use REDIRECT in order for path to be resolved to top-level "/home"
				// and because we are switching in/out of workspace / site mode,
				// otherwise the resolved URL will be /workspace/...lots of stuff.../home which is NOT what we want
				signal: "route/REDIRECT",
				path: "/home",
			},
		],
		context
	)

	return (
		<>
			<Tile context={context}>
				<IOGroup
					styleTokens={{
						root: ["gap-1"],
					}}
					context={context}
				>
					<IOImage
						height="32"
						variant="uesio/appkit.uesio_logo"
						file="uesio/core.logowhite"
						context={context}
						onClick={homeLogoOnClick}
						link={homeLogoLink}
					/>
					<IOButton
						iconText={nsInfo?.icon}
						tooltip="App Home"
						tooltipPlacement="top"
						tooltipOffset={10}
						onClick={() => {
							api.signal.run(
								{
									signal: "route/NAVIGATE",
									path: `/app/${workspace.app}`,
									namespace: "uesio/studio",
								},
								context.deleteWorkspace()
							)
						}}
						classes={{ root: classes.linkButton }}
						styleTokens={{
							root: [`bg-[${nsInfo?.color}]`, "text-white"],
						}}
						context={context}
					/>
					<IOButton
						iconText="handyman"
						tooltip="Workspace Home"
						tooltipPlacement="top"
						tooltipOffset={10}
						onClick={() => {
							api.signal.run(
								{
									signal: "route/NAVIGATE",
									path: `/app/${workspace.app}/workspace/${workspace.name}`,
									namespace: "uesio/studio",
								},
								context.deleteWorkspace()
							)
						}}
						classes={{ root: classes.linkButton }}
						context={context}
					/>
					<IOButton
						iconText="view_quilt"
						tooltip="Views List"
						tooltipPlacement="top"
						tooltipOffset={10}
						onClick={() => {
							api.signal.run(
								{
									signal: "route/NAVIGATE",
									path: `/app/${workspace.app}/workspace/${workspace.name}/views`,
									namespace: "uesio/studio",
								},
								context.deleteWorkspace()
							)
						}}
						classes={{ root: classes.linkButton }}
						context={context}
					/>
					<IOButton
						text={viewName}
						onClick={() => {
							api.signal.run(
								{
									signal: "route/NAVIGATE",
									path: `/app/${workspace.app}/workspace/${workspace.name}/views/${viewNamespace}/${viewName}`,
									namespace: "uesio/studio",
								},
								context.deleteWorkspace()
							)
						}}
						classes={{ root: classes.linkButton }}
						context={context}
					/>
					<Avatar
						image="$User{picture}"
						text="$User{initials}"
						context={context}
					/>
				</IOGroup>
			</Tile>
			<SaveCancelArea context={context} />
		</>
	)
}

export default MainHeader

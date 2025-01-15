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
	root: ["flex", "gap-2"],
	handle: ["grid", "gap-0.5", "w-2", "content-center", "cursor-grab"],
	handleGrip: ["bg-slate-200", "w-full", "h-[2px]", "rounded-full"],
	toolbar: ["grid", "gap-1"],
	toolbarButton: [
		"px-1",
		"bg-slate-100",
		"rounded",
		"text-slate-600",
		"text-xs",
	],
	linkButton: ["h-8", "rounded", "text-slate-600", "px-2", "text-xs"],
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
		<div className={classes.root}>
			<Tile context={context}>
				<IOGroup
					styleTokens={{
						root: ["gap-1"],
					}}
					context={context}
				>
					<IOImage
						height="32"
						width="32"
						variant="uesio/appkit.uesio_logo"
						file="uesio/core.logowhite"
						context={context}
						onClick={homeLogoOnClick}
						link={homeLogoLink}
					/>
					<IOGroup
						context={context}
						variant="uesio/appkit.breadcrumbs"
						styleTokens={{
							root: ["mr-1"],
						}}
					>
						<IOButton
							iconText={nsInfo?.icon}
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
							link={`/app/${workspace.app}`}
							classes={{ root: classes.linkButton }}
							styleTokens={{
								root: [`text-[${nsInfo?.color}]`],
							}}
							context={context}
						/>
						<component.Component
							componentType={"uesio/appkit.icontile"}
							path=""
							definition={{
								icon: "handyman",
								tileVariant: "uesio/appkit.breadcrumb",
								signals: [
									{
										signal: "route/NAVIGATE",
										path: `/app/${workspace.app}/workspace/${workspace.name}`,
										namespace: "uesio/studio",
									},
								],
								["uesio.styleTokens"]: {
									root: ["ml-2.5"],
								},
							}}
							context={context.deleteWorkspace()}
						/>
						<component.Component
							componentType={"uesio/appkit.icontile"}
							path=""
							definition={{
								icon: "view_quilt",
								tileVariant: "uesio/appkit.breadcrumb",
								signals: [
									{
										signal: "route/NAVIGATE",
										path: `/app/${workspace.app}/workspace/${workspace.name}/views`,
										namespace: "uesio/studio",
									},
								],
								["uesio.styleTokens"]: {
									root: ["ml-1.5"],
								},
							}}
							context={context.deleteWorkspace()}
						/>
						<component.Component
							componentType={"uesio/appkit.icontile"}
							path=""
							definition={{
								title: viewName,
								tileVariant: "uesio/appkit.breadcrumb",
								signals: [
									{
										signal: "route/NAVIGATE",
										path: `/app/${workspace.app}/workspace/${workspace.name}/views/${viewNamespace}/${viewName}`,
										namespace: "uesio/studio",
									},
								],
								["uesio.styleTokens"]: {
									root: ["ml-1.5", "max-w-[80px]"],
									title: [
										"overflow-hidden",
										"[text-overflow:ellipsis]",
									],
								},
							}}
							context={context.deleteWorkspace()}
						/>
					</IOGroup>
					<Avatar
						image="$User{picture}"
						text="$User{initials}"
						context={context}
					/>
				</IOGroup>
				<SaveCancelArea context={context} />
			</Tile>
			<div className={classes.handle}>
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
				<div className={classes.handleGrip} />
			</div>
			<div className={classes.toolbar}>
				<IOButton
					iconText="dashboard"
					classes={{ root: classes.toolbarButton }}
					context={context}
				/>
				<IOButton
					iconText="devices"
					classes={{ root: classes.toolbarButton }}
					context={context}
				/>
				<IOButton
					iconText="right_panel_close"
					classes={{ root: classes.toolbarButton }}
					context={context}
				/>
			</div>
		</div>
	)
}

export default MainHeader

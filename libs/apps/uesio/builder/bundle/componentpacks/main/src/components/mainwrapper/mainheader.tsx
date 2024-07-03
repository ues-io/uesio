import { api, definition, component } from "@uesio/ui"
import HeaderCrumbs from "./headercrumbs"
import { getBuilderNamespace } from "../../api/stateapi"

// Yes, navigator.platform is deprecated, but according to MDN in 2023
// it's still the least bad way to detect what meta key means
// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples
export const metaKey =
	navigator.platform.indexOf("Mac") === 0 || navigator.platform === "iPhone"
		? "⌘" // Command
		: "^" // Ctrl

const MainHeader: definition.UtilityComponent = (props) => {
	const { context } = props
	const IOImage = component.getUtility("uesio/io.image")
	const Tile = component.getUtility("uesio/io.tile")

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
			<Tile
				context={context}
				avatar={
					<IOImage
						height="32"
						variant="uesio/appkit.uesio_logo"
						file="uesio/core.logowhite"
						context={context}
						onClick={homeLogoOnClick}
						link={homeLogoLink}
					/>
				}
			>
				<component.Component
					componentType={"uesio/appkit.icontile"}
					path=""
					definition={{
						title: workspace.app,
						icon: nsInfo?.icon,
						iconcolor: nsInfo?.color,
						tileVariant: "uesio/appkit.apptag",
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
			</Tile>
			<HeaderCrumbs context={context} />
		</>
	)
}

export default MainHeader

import { api, definition, component, styles } from "@uesio/ui"
import SaveCancelArea from "./savecancelarea"
import HeaderCrumbs from "./headercrumbs"
import { useBuildMode } from "../../api/stateapi"

const StyleDefaults = Object.freeze({
	root: [
		"grid-flow-col",
		"justify-between",
		"h-[60px]",
		"bg-slate-50",
		"items-center",
		"gap-2",
		"px-4",
		"shrink-0",
	],
	logo: ["pr-4", "opacity-80"],
	avatar: ["h-9", "w-9", "border-2", "border-white"],
})

// Yes, navigator.platform is deprecated, but according to MDN in 2023
// it's still the least bad way to detect what meta key means
// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples
export const metaKey =
	navigator.platform.indexOf("Mac") === 0 || navigator.platform === "iPhone"
		? "⌘" // Command
		: "^" // Ctrl

const MainHeader: definition.UtilityComponent = (props) => {
	const { context, id } = props
	const Grid = component.getUtility("uesio/io.grid")
	const Group = component.getUtility("uesio/io.group")
	const IOImage = component.getUtility("uesio/io.image")
	const Avatar = component.getUtility("uesio/io.avatar")
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	const [buildMode, setBuildMode] = useBuildMode(context)
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
		<Grid className={classes.root} context={context}>
			<Group context={context}>
				<IOImage
					className={classes.logo}
					height="34"
					file="uesio/core.logo"
					context={context}
					onClick={homeLogoOnClick}
					link={homeLogoLink}
				/>
				<HeaderCrumbs context={context} />
			</Group>
			<Group context={context} className="gap-3">
				<Button
					context={context}
					label={"Preview"}
					icon={
						<Icon
							context={context}
							weight={300}
							fill={false}
							icon={"visibility"}
						/>
					}
					variant="uesio/builder.secondarytoolbar"
					onClick={() => {
						api.builder.getBuilderDeps(context).then(() => {
							setBuildMode(!buildMode)
						})
					}}
					tooltip={`Toggle Preview / Build mode (${metaKey} + U)`}
					tooltipPlacement="left"
				/>
				<SaveCancelArea id={id} context={context} />
				<Avatar
					className={classes.avatar}
					image="$User{picture}"
					text="$User{initials}"
					context={context}
				/>
			</Group>
		</Grid>
	)
}

export default MainHeader

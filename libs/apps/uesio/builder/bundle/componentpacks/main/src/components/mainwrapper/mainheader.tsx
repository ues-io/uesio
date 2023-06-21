import { api, definition, component, styles } from "@uesio/ui"
import SaveCancelArea from "./savecancelarea"
import HeaderCrumbs from "./headercrumbs"

const StyleDefaults = Object.freeze({
	root: [
		"grid-flow-col",
		"justify-between",
		"bg-slate-100",
		"h-12",
		"items-center",
		"gap-2",
		"px-3",
		"shrink-0",
	],
	logo: ["opacity-80", "pr-4"],
	avatar: ["h-7", "w-7"],
})

const MainHeader: definition.UtilityComponent = (props) => {
	const { context, id } = props
	const Grid = component.getUtility("uesio/io.grid")
	const Group = component.getUtility("uesio/io.group")
	const IOImage = component.getUtility("uesio/io.image")
	const Avatar = component.getUtility("uesio/io.avatar")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
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
					height="28"
					file="uesio/core.logo"
					context={context}
					onClick={homeLogoOnClick}
					link={homeLogoLink}
				/>
				<HeaderCrumbs context={context} />
			</Group>
			<Group context={context} className="gap-3">
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

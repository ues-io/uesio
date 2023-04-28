import { definition, component, styles } from "@uesio/ui"
import SaveCancelArea from "./savecancelarea"
import DeviceSizer from "./devicesizer"
import HeaderActions from "./headeractions"

const MainHeader: definition.UtilityComponent = (props) => {
	const { context, id } = props
	const Grid = component.getUtility("uesio/io.grid")
	const Group = component.getUtility("uesio/io.group")
	const IOImage = component.getUtility("uesio/io.image")
	const Avatar = component.getUtility("uesio/io.avatar")

	const classes = styles.useUtilityStyleTokens(
		{
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
		},
		props
	)

	return (
		<Grid className={classes.root} context={context}>
			<Group context={context}>
				<IOImage
					className={classes.logo}
					height="28"
					file="uesio/core.logo"
					context={context}
				/>
			</Group>
			<DeviceSizer context={context} />
			<Group context={context}>
				<SaveCancelArea id={id} context={context} />
				<HeaderActions context={context} />
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

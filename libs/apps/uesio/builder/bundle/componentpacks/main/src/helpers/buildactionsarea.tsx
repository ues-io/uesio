import { definition, styles } from "@uesio/ui"

type Props = {
	justify?: string
}

const BuildActionsArea: definition.UtilityComponent<Props> = (props) => {
	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				"flex",
				`justify-${props.justify || "end"}`,
				"p-2",
				"relative",
			],
		},
		props
	)

	return <div className={classes.root}>{props.children}</div>
}

export default BuildActionsArea

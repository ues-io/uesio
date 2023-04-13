import { definition, styles } from "@uesio/ui"

type Props = {
	justify?: string
}

const BuildActionsArea: definition.UtilityComponent<Props> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				justifyContent: props.justify || "end",
				padding: "8px",
				position: "relative",
				backgroundColor: "#fafafa",
			},
		},
		props
	)

	return <div className={classes.root}>{props.children}</div>
}

export default BuildActionsArea

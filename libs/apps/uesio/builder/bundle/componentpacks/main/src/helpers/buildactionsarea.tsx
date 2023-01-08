import { definition, styles } from "@uesio/ui"

const BuildActionsArea: definition.UtilityComponent = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				justifyContent: "end",
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

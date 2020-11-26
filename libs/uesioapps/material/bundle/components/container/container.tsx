import React, { ReactElement } from "react"
import { ContainerProps } from "./containerdefinition"
import { component, material, styles } from "@uesio/ui"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: ContainerProps) => ({
			padding: theme.spacing(
				styles.useStyleProperty(props.definition.padding, 1)
			),
		}),
	})
)

function Container(props: ContainerProps): ReactElement {
	const classes = useStyles(props)

	const slotProps = {
		definition: props.definition,
		listName: "components",
		path: props.path,
		accepts: ["uesio.standalone"],
		context: props.context,
	}
	return (
		<material.Container className={classes.root}>
			<component.Slot {...slotProps} />
		</material.Container>
	)
}

export default Container

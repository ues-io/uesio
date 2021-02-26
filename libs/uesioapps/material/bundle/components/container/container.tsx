import React, { FunctionComponent } from "react"
import { ContainerProps } from "./containerdefinition"
import { component, styles } from "@uesio/ui"
import * as material from "@material-ui/core"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: ContainerProps) => ({
			padding: theme.spacing(
				styles.useStyleProperty(props.definition.padding, 1)
			),
		}),
	})
)

const Container: FunctionComponent<ContainerProps> = (props) => {
	const classes = useStyles(props)
	return (
		<material.Container className={classes.root}>
			<component.Slot
				definition={props.definition}
				listName="components"
				path={props.path}
				accepts={["uesio.standalone"]}
				context={props.context}
			/>
		</material.Container>
	)
}

export default Container

import { FunctionComponent } from "react"
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

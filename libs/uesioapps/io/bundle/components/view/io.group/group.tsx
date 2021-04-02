import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { GroupProps } from "./groupdefinition"

const IOGrid = component.registry.getUtility("io.grid")

const useStyles = styles.getUseStyles(["root"], {
	root: (props: GroupProps) => ({
		gridTemplateColumns: props.definition?.components
			?.map(() => props.definition.width || "100px")
			.join(" "),
		columnGap: "10px",
	}),
})

const Grid: FunctionComponent<GroupProps> = (props) => {
	const classes = useStyles(props)
	return (
		<IOGrid className={classes.root} context={props.context}>
			<component.Slot
				definition={props.definition}
				listName="components"
				path={props.path}
				accepts={["uesio.standalone"]}
				context={props.context}
			/>
		</IOGrid>
	)
}

export default Grid

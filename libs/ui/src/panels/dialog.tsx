import { FunctionComponent } from "react"
import { createUseStyles } from "react-jss"
import { get, getUtility } from "../component/registry"
import { DialogBase, DialogProps } from "./plaindialog"
import Slot from "../components/slot"

const TitleBar = getUtility("io.titlebar")
const IconButton = getUtility("io.iconbutton")
const Grid = getUtility("io.grid")
const Group = get("io.group")

const useStyles = createUseStyles({
	root: {
		gridTemplateRows: "auto 1fr auto",
		height: "100%",
	},
})

const Dialog: FunctionComponent<DialogProps> = (props) => {
	const classes = useStyles(props)
	return (
		<DialogBase {...props}>
			<Grid className={classes.root} context={props.context}>
				<TitleBar
					title={props.definition?.title}
					variant="io.dialog"
					context={props.context}
					actions={
						<IconButton
							icon="close"
							onClick={props.close}
							context={props.context}
						/>
					}
				/>
				<div style={{ padding: "20px", overflow: "auto" }}>
					<Slot
						definition={props.definition}
						listName="components"
						path={props.path}
						accepts={["uesio.standalone"]}
						context={props.context}
					/>
				</div>
				{props.definition?.actions && (
					<Group
						context={props.context}
						definition={{
							components: props.definition?.actions,
							"uesio.styles": {
								root: {
									justifyContent: "end",
									padding: "20px",
								},
							},
						}}
					/>
				)}
			</Grid>
		</DialogBase>
	)
}

export default Dialog

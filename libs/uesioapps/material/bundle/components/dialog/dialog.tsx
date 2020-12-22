import { FunctionComponent } from "react"
import { hooks, material, component } from "@uesio/ui"
import { DialogProps, DialogState } from "./dialogdefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: {
			margin: theme.spacing(1),
		},
	})
)

const Dialog: FunctionComponent<DialogProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const classes = useStyles(props)
	const { definition, path, context } = props

	const initialState: DialogState = {
		mode: definition.mode || "CLOSE",
	}

	const componentState = uesio.component.useState(
		definition.id,
		initialState
	) as DialogState

	if (!componentState) return null

	return (
		<material.Dialog
			open={componentState.mode === "OPEN"}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<material.DialogTitle>{definition.title}</material.DialogTitle>
			<material.DialogContent>
				<material.DialogContentText>
					<component.Slot
						definition={definition}
						listName="content"
						path={path}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				</material.DialogContentText>
			</material.DialogContent>
			<material.DialogActions>
				<material.Button
					color="primary"
					className={classes.root}
					onClick={
						definition?.disagreeSignals &&
						uesio.signal.getHandler(definition.disagreeSignals)
					}
				>
					Disagree
				</material.Button>
				<material.Button
					color="primary"
					className={classes.root}
					onClick={
						definition?.agreeSignals &&
						uesio.signal.getHandler(definition.agreeSignals)
					}
				>
					Agree
				</material.Button>
			</material.DialogActions>
		</material.Dialog>
	)
}

export default Dialog

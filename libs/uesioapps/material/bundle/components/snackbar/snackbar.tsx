import React, { FunctionComponent } from "react"
import { definition, material } from "@uesio/ui"
import Alert from "../alert/alert"

interface SnackbarProps extends definition.BaseProps {
	severity?: "error" | "success" | "info" | "warning"
	location?: "bottom" | "top"
	displayDuration?: number
	hidingAnimationDuration?: number
}

const Snackbar: FunctionComponent<SnackbarProps> = (props) => {
	const [open, setOpen] = React.useState(true)

	const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
		if (reason === "clickaway") {
			return
		}

		setOpen(false)
	}

	return (
		<material.Snackbar
			open={open}
			autoHideDuration={6000}
			onClose={handleClose}
		>
			<Alert> This is a success message!</Alert>
		</material.Snackbar>
	)
	//return <material.Snackbar {...props}>{children}</material.Snackbar>
}

Snackbar.displayName = "Snackbar"

export default Snackbar

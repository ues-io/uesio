import React, { FunctionComponent, useState, SyntheticEvent } from "react"
import { definition, material } from "@uesio/ui"
import Alert from "../alert/alert"

interface SnackbarProps extends definition.BaseProps {
	severity?: "error" | "success" | "info" | "warning"
	location?: "bottom" | "top"
	displayDuration?: number
	hidingAnimationDuration?: number
}

const Snackbar: FunctionComponent<SnackbarProps> = (props) => {
	const { children, severity } = props
	const [open, setOpen] = useState(true)

	const handleClose = (event?: SyntheticEvent, reason?: string) => {
		if (reason === "clickaway") {
			return
		}

		setOpen(false)
	}

	return (
		<material.Snackbar
			anchorOrigin={{
				vertical: "top",
				horizontal: "left",
			}}
			open={open}
			autoHideDuration={6000}
			onClose={handleClose}
		>
			<Alert onClose={handleClose} severity={severity}>
				{children}
			</Alert>
		</material.Snackbar>
	)
}

Snackbar.displayName = "Snackbar"

export default Snackbar

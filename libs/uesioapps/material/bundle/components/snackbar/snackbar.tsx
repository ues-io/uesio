import React, { FunctionComponent, useState, SyntheticEvent } from "react"
import { definition, material } from "@uesio/ui"
import Alert from "../alert/alert"

interface SnackbarProps extends definition.BaseProps {
	severity?: "error" | "success" | "info" | "warning"
	autoHideDuration?: number
}

const Snackbar: FunctionComponent<SnackbarProps> = ({
	children,
	severity,
	autoHideDuration = 6000,
}) => {
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
				horizontal: "center",
			}}
			open={open}
			autoHideDuration={autoHideDuration}
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

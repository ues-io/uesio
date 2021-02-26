// This component was mostly copied from @material-ui/lab
// But to avoid a weird bug with lab buttons, I just copied it
// into here. Eventually, if the Alert component makes it out of
// lab, we can delete this.
import * as React from "react"
import clsx from "clsx"

import * as material from "@material-ui/core"
import Icon from "../icon/icon"

export const styles = (theme: material.Theme): material.StyleRules => {
	const darken = material.darken
	const lighten = material.lighten
	const getColor = theme.palette.type === "light" ? darken : lighten
	const getBackgroundColor = theme.palette.type === "light" ? lighten : darken

	return {
		/* Styles applied to the root element. */
		root: {
			...theme.typography.body2,
			borderRadius: theme.shape.borderRadius,
			backgroundColor: "transparent",
			display: "flex",
			padding: "6px 16px",
		},
		/* Styles applied to the root element if `variant="standard"` and `color="success"`. */
		standardSuccess: {
			color: getColor(theme.palette.success.main, 0.6),
			backgroundColor: getBackgroundColor(
				theme.palette.success.main,
				0.9
			),
			"& $icon": {
				color: theme.palette.success.main,
			},
		},
		/* Styles applied to the root element if `variant="standard"` and `color="info"`. */
		standardInfo: {
			color: getColor(theme.palette.info.main, 0.6),
			backgroundColor: getBackgroundColor(theme.palette.info.main, 0.9),
			"& $icon": {
				color: theme.palette.info.main,
			},
		},
		/* Styles applied to the root element if `variant="standard"` and `color="warning"`. */
		standardWarning: {
			color: getColor(theme.palette.warning.main, 0.6),
			backgroundColor: getBackgroundColor(
				theme.palette.warning.main,
				0.9
			),
			"& $icon": {
				color: theme.palette.warning.main,
			},
		},
		/* Styles applied to the root element if `variant="standard"` and `color="error"`. */
		standardError: {
			color: getColor(theme.palette.error.main, 0.6),
			backgroundColor: getBackgroundColor(theme.palette.error.main, 0.9),
			"& $icon": {
				color: theme.palette.error.main,
			},
		},
		/* Styles applied to the root element if `variant="outlined"` and `color="success"`. */
		outlinedSuccess: {
			color: getColor(theme.palette.success.main, 0.6),
			border: `1px solid ${theme.palette.success.main}`,
			"& $icon": {
				color: theme.palette.success.main,
			},
		},
		/* Styles applied to the root element if `variant="outlined"` and `color="info"`. */
		outlinedInfo: {
			color: getColor(theme.palette.info.main, 0.6),
			border: `1px solid ${theme.palette.info.main}`,
			"& $icon": {
				color: theme.palette.info.main,
			},
		},
		/* Styles applied to the root element if `variant="outlined"` and `color="warning"`. */
		outlinedWarning: {
			color: getColor(theme.palette.warning.main, 0.6),
			border: `1px solid ${theme.palette.warning.main}`,
			"& $icon": {
				color: theme.palette.warning.main,
			},
		},
		/* Styles applied to the root element if `variant="outlined"` and `color="error"`. */
		outlinedError: {
			color: getColor(theme.palette.error.main, 0.6),
			border: `1px solid ${theme.palette.error.main}`,
			"& $icon": {
				color: theme.palette.error.main,
			},
		},
		/* Styles applied to the root element if `variant="filled"` and `color="success"`. */
		filledSuccess: {
			color: "#fff",
			fontWeight: theme.typography.fontWeightMedium,
			backgroundColor: theme.palette.success.main,
		},
		/* Styles applied to the root element if `variant="filled"` and `color="info"`. */
		filledInfo: {
			color: "#fff",
			fontWeight: theme.typography.fontWeightMedium,
			backgroundColor: theme.palette.info.main,
		},
		/* Styles applied to the root element if `variant="filled"` and `color="warning"`. */
		filledWarning: {
			color: "#fff",
			fontWeight: theme.typography.fontWeightMedium,
			backgroundColor: theme.palette.warning.main,
		},
		/* Styles applied to the root element if `variant="filled"` and `color="error"`. */
		filledError: {
			color: "#fff",
			fontWeight: theme.typography.fontWeightMedium,
			backgroundColor: theme.palette.error.main,
		},
		/* Styles applied to the icon wrapper element. */
		icon: {
			marginRight: 12,
			padding: "7px 0",
			display: "flex",
			fontSize: 22,
			opacity: 0.9,
		},
		/* Styles applied to the message wrapper element. */
		message: {
			padding: "8px 0",
		},
		/* Styles applied to the action wrapper element if `action` is provided. */
		action: {
			display: "flex",
			alignItems: "center",
			marginLeft: "auto",
			paddingLeft: 16,
			marginRight: -8,
		},
	}
}

const defaultIconMapping = {
	success: "success",
	warning: "warning",
	error: "error",
	info: "info",
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Alert = React.forwardRef((props: any, ref) => {
	const {
		action,
		children,
		classes,
		className,
		closeText = "Close",
		color,
		icon,
		iconMapping = defaultIconMapping,
		onClose,
		role = "alert",
		severity = "success",
		variant = "standard",
		...other
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} = props as any

	const iconNode = (
		<Icon
			path={props.path}
			context={props.context}
			definition={{
				type: iconMapping[severity],
				size: "small",
			}}
		/>
	)

	return (
		<material.Paper
			role={role}
			square
			elevation={0}
			className={clsx(
				classes.root,
				classes[`${variant}${material.capitalize(color || severity)}`],
				className
			)}
			ref={ref}
			{...other}
		>
			{icon !== false ? (
				<div className={classes.icon}>{icon || iconNode}</div>
			) : null}
			<div className={classes.message}>{children}</div>
			{action ? <div className={classes.action}>{action}</div> : null}
			{!action && onClose ? (
				<div className={classes.action}>
					<material.IconButton
						size="small"
						aria-label={closeText}
						title={closeText}
						color="inherit"
						onClick={onClose}
					>
						<Icon
							path={props.path}
							context={props.context}
							definition={{
								type: "close",
								size: "small",
							}}
						/>
					</material.IconButton>
				</div>
			) : null}
		</material.Paper>
	)
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default material.withStyles(styles, { name: "MuiAlert" })(Alert) as any

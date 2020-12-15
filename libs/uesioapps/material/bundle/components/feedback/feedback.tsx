import React, { FunctionComponent, useState, useEffect, useRef } from "react"
import { makeStyles, createStyles } from "@material-ui/core"
import { definition } from "@uesio/ui"
import Alert from "../alert/alert"

interface FeedbackProps extends definition.BaseProps {
	severity?: "error" | "success" | "info" | "warning"
}

const useStyles = makeStyles(() =>
	createStyles({
		hidden: {
			position: "absolute",
			bottom: -130,
			right: 0,
			width: "100%",
			transition: "bottom 1000ms ease-out",
		},
		shown: {
			position: "absolute",
			bottom: 1,
			right: 0,
			width: "100%",
			transition: "bottom 1000ms ease-in",
		},
	})
)

const Feedback: FunctionComponent<FeedbackProps> = (props) => {
	const { children } = props
	const [isHidden, setIsHidden] = useState(true)
	const [doDestroy, setDoDestroy] = useState(false)
	const mounted = useRef<boolean>(false)
	const classes = useStyles()

	useEffect(() => {
		if (!mounted.current) {
			// componentDidMount
			mounted.current = true
			setTimeout(() => setIsHidden(false), 0)
		} else {
			// componentDidUpdate
			if (!isHidden) {
				// force hidding after 5000ms
				setTimeout(() => {
					setIsHidden(true)
				}, 5000)

				// force destroying once the job is done
				setTimeout(() => {
					setDoDestroy(true)
				}, 6000)
			}
		}
	})

	// destroy the component after the feeback vanished
	if (doDestroy) {
		return null
	}

	return (
		<div className={isHidden ? classes.hidden : classes.shown}>
			<Alert style={{ padding: "30px" }} {...props}>
				{children}
			</Alert>
		</div>
	)
}

Feedback.displayName = "Feedback"

export default Feedback

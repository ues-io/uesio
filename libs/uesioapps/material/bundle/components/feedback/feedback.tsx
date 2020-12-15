import React, { FunctionComponent, useState, useEffect, useRef } from "react"
import { makeStyles, createStyles } from "@material-ui/core"
import { definition } from "@uesio/ui"
import Alert from "../alert/alert"

interface FeedbackProps extends definition.BaseProps {
	severity?: "error" | "success" | "info" | "warning"
}

const useStyles = makeStyles(() =>
	createStyles({
		hidden: ({ duration }: { duration: number }) => ({
			position: "absolute",
			bottom: -120,
			right: 0,
			width: "100%",
			transition: `all ${duration}ms ease-out`,
			opacity: 0,
		}),
		shown: {
			position: "absolute",
			bottom: 0,
			right: 0,
			width: "100%",
			transition: "all 1000ms ease-in",
			opacity: 1,
		},
	})
)

const Feedback: FunctionComponent<FeedbackProps> = (props) => {
	const hidingAnimationDuration = 1000
	const displayDuration = 5000
	const { children } = props
	const [isHidden, setIsHidden] = useState(true)
	const [doDestroy, setDoDestroy] = useState(false)
	const mounted = useRef<boolean>(false)
	const classes = useStyles({ duration: hidingAnimationDuration })

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
				}, displayDuration)

				// force component to re-render
				setTimeout(() => {
					setDoDestroy(true)
				}, displayDuration + hidingAnimationDuration)
			}
		}
	})

	// destroy the component after it has vanished
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

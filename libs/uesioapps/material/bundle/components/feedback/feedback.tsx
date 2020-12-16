import React, { FunctionComponent, useState, useEffect, useRef } from "react"
import { makeStyles, createStyles } from "@material-ui/core"
import { definition } from "@uesio/ui"
import Alert from "../alert/alert"

interface FeedbackProps extends definition.BaseProps {
	severity?: "error" | "success" | "info" | "warning"
	location?: "bottom" | "top"
	displayDuration?: number
	hidingAnimationDuration?: number
}

type FeedbackStyle = Required<
	Pick<FeedbackProps, "location" | "hidingAnimationDuration">
>

const useStyles = makeStyles(() =>
	createStyles({
		hidden: ({ hidingAnimationDuration, location }: FeedbackStyle) => ({
			...{
				position: "absolute",
				right: 0,
				width: "100%",
				transition: `all ${hidingAnimationDuration}ms ease-out`,
				opacity: 0,
			},
			...{ [location]: -120 },
		}),
		shown: ({ location }: FeedbackStyle) => ({
			...{
				position: "absolute",
				right: 0,
				width: "100%",
				transition: "all 1000ms ease-in",
				opacity: 1,
			},
			...{ [location]: 0 },
		}),
	})
)

const Feedback: FunctionComponent<FeedbackProps> = (props) => {
	const {
		displayDuration = 5000,
		hidingAnimationDuration = 1000,
		location = "bottom",
		children,
	} = props

	const [isHidden, setIsHidden] = useState(true)
	const [doDestroy, setDoDestroy] = useState(false)
	const mounted = useRef<boolean>(false)
	const classes = useStyles({ hidingAnimationDuration, location })

	useEffect(() => {
		if (!mounted.current) {
			// componentDidMount
			mounted.current = true
			setTimeout(() => setIsHidden(false), 0)
		} else {
			// componentDidUpdate
			if (!isHidden) {
				// force hidding after displayDuration elapsed
				setTimeout(() => {
					setIsHidden(true)
				}, displayDuration)

				// force unmounting component after the hiding animation completed
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

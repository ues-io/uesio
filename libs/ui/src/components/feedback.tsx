import React, { FunctionComponent, useState, useEffect, useRef } from "react"
import { BaseProps } from "../definition/definition"
import { ComponentInternal } from "../component/component"
import { makeStyles, createStyles } from "@material-ui/core"

type Props = {
	severity?: "error" | "success" | "info" | "warning"
} & BaseProps

const useStyles = makeStyles(() =>
	createStyles({
		hidden: {
			position: "absolute",
			bottom: -500,
			right: 10,
			width: "100%",
			transition: "bottom 1000ms ease-out",
		},
		shown: {
			position: "absolute",
			bottom: 30,
			right: 10,
			width: "100%",
			transition: "bottom 1000ms ease-in",
		},
	})
)

const Feedback: FunctionComponent<Props> = (props) => {
	const { children, context } = props
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
			<ComponentInternal
				style={{ padding: "30px" }}
				{...props}
				componentType="material.alert"
				path=""
				context={context}
			>
				<div>Component Not Found: {children}</div>
			</ComponentInternal>
		</div>
	)
}

Feedback.displayName = "Feedback"

export default Feedback

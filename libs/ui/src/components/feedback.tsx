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
			bottom: 100,
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
				// force hidding after 3000ms
				setTimeout(() => {
					setIsHidden(true)
					setDoDestroy(true)
				}, 3000)
			}
		}
	})

	// destroy the component after the feeback vanished
	if (doDestroy) {
		return null
	}

	const p = {
		...props,
		padding: "50px",
	}

	return (
		<div className={isHidden ? classes.hidden : classes.shown}>
			<ComponentInternal
				{...p}
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

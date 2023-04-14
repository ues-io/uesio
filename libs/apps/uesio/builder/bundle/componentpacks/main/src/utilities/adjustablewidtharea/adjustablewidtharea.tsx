import { definition, styles } from "@uesio/ui"
import { useEffect, useRef, useState } from "react"
import throttle from "lodash/throttle"

const usePanels = (
	element: HTMLDivElement | null
): [(arg: boolean) => void, number] => {
	const [width, setWidth] = useState(300)
	const [dragging, setDragging] = useState(false)
	const panelPosition = element?.getBoundingClientRect().left

	// woah not soo fast
	const throttledMouseHandler = throttle((e) => {
		if (!dragging) return

		const mouseX = e.clientX

		if (!panelPosition || !mouseX) return
		const change = panelPosition - mouseX
		const x = width + change
		const min = 250
		const max = 600

		if (x < min) {
			setWidth(min)
			return
		}
		if (x > max) {
			setWidth(max)
			return
		}

		setWidth(x)
	}, 50)

	useEffect(() => {
		if (!dragging) return
		document.addEventListener("mousemove", throttledMouseHandler)
		document.addEventListener("mouseup", () => setDragging(false))

		return () => {
			document.removeEventListener("mousemove", throttledMouseHandler)
			document.removeEventListener("mouseup", () => setDragging(false))
		}
		// NOTE: We do NOT want to add throttledMouseHandler to this deps list,
		// like eslint is suggesting -- that creates a very bad experience
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dragging])

	return [setDragging, width]
}

const AdjustableWidthArea: definition.UtilityComponent = (props) => {
	const slideRef = useRef<HTMLDivElement>(null)
	const [setDragging, codePanelWidth] = usePanels(slideRef.current)

	const classes = styles.useUtilityStyles(
		{
			root: {
				width: codePanelWidth + "px",
			},
			separator: {
				display: "flex",
				alignItems: "center",
				cursor: "ew-resize",
				width: "10px",
				position: "absolute",
				left: 0,
				top: 0,
				height: "100%",
				zIndex: 1,

				"&:hover span, &:active span": {
					opacity: 1,
					cursor: "ew-resize",
				},
			},
			grabber: {
				backgroundColor: "rgb(255, 94, 47)",
				width: "4px",
				height: "8em",
				borderRadius: "6px",
				transform: "translateX(-50%)",
				opacity: 0.5,
				cursor: "ew-resize",
				maxHeight: "6em",
				transition: "all 0.125s ease",
				position: "absolute",
			},
		},
		props
	)

	return (
		<div ref={slideRef} className={classes.root}>
			<div
				role="seperator"
				aria-valuenow={0}
				onMouseDown={() => setDragging(true)}
				className={classes.separator}
			>
				<span className={classes.grabber} />
			</div>
			{props.children}
		</div>
	)
}

export default AdjustableWidthArea

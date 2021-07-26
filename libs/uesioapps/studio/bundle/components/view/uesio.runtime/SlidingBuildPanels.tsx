import React, { FC, useState, useEffect } from "react"
import _ from "lodash"
import { styles } from "@uesio/ui"

type T = {
	showCode: boolean
	slidePanelsRef: React.RefObject<HTMLDivElement>
	builderContext: any
	canvasContext: any
}
import CodePanel from "../../shared/codepanel"
import Canvas from "../../shared/canvas"

const SlidingBuildPanels: FC<T> = ({
	builderContext,
	canvasContext,
	showCode = false,
	slidePanelsRef,
}) => {
	const [leftWidth, setLeftWidth] = useState("100%")
	const [dragging, setDragging] = useState(false)

	useEffect(() => {
		if (!showCode) setLeftWidth("100%")
	}, [showCode])

	const handleMouseChange = (e: React.MouseEvent) => {
		if (!dragging || !slidePanelsRef || !slidePanelsRef.current) return

		const boxOffset = slidePanelsRef.current.getBoundingClientRect().left
		const boxWidth = slidePanelsRef.current.offsetWidth
		const newWidth =
			Math.round(((e.clientX - boxOffset) / boxWidth) * 1000) / 10
		setLeftWidth(newWidth > 40 ? `${newWidth}%` : `40%`)
	}

	// woah not soo fast
	const throttledMouseHandler = _.throttle(
		(e) => handleMouseChange(e),
		300,
		{}
	)

	useEffect(() => {
		document.addEventListener("mousemove", throttledMouseHandler)
		document.addEventListener("mouseup", () => setDragging(false))

		return () => {
			document.removeEventListener("mousemove", throttledMouseHandler)
			document.removeEventListener("mouseup", () => setDragging(false))
		}
	})

	return (
		<>
			<Canvas
				className={styles.css({
					flex: "auto",
					maxWidth: `${leftWidth}`,
					willChange: "max-width",
					transition: "all 0.7s ease",
				})}
				context={canvasContext}
			/>

			{/* TODO monday */}
			{/* Make entire line interactable */}
			{showCode && (
				<>
					<div
						role="seperator"
						aria-valuenow={0}
						onMouseDown={() => setDragging(true)}
						className={styles.css({
							display: "flex",
							alignItems: "center",
							cursor: "ew-resize",
						})}
					>
						<span
							className={styles.css({
								backgroundColor: "rgb(255, 94, 47)",
								width: "4px",
								height: "8em",
								borderRadius: "6px",
								transform: "translateX(-50%)",
								opacity: 0.5,
								cursor: "ew-resize",
								maxHeight: "6em",
								transition: "all 0.125s ease",

								"&:hover, &:active": {
									opacity: 1,
								},
							})}
						/>
					</div>
					<CodePanel
						context={builderContext}
						className={styles.css({
							flex: "auto",
						})}
					/>
				</>
			)}
		</>
	)
}

export default SlidingBuildPanels

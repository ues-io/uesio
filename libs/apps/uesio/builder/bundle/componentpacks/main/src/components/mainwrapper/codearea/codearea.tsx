import { useRef } from "react"
import { definition, styles } from "@uesio/ui"

import CodePanel from "./codepanel"
import usePanels from "./usePanels"
import { useBuilderState } from "../../../api/stateapi"

const CodeArea: definition.UtilityComponent = (props) => {
	const slideRef = useRef<HTMLDivElement>(null)
	const [setDragging, codePanelWidth] = usePanels(slideRef.current)

	const [showCode] = useBuilderState<boolean>(props.context, "codepanel")

	if (!showCode) return null

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
			codepanel: {
				position: "relative",
				boxShadow: "0 0 19px -6px rgb(0 0 0 / 20%)",
			},
		},
		props
	)

	return (
		<div
			ref={slideRef}
			className={styles.cx(props.className, classes.root)}
		>
			{/* Whole box, from top to down that is slidable */}
			<div
				role="seperator"
				aria-valuenow={0}
				onMouseDown={() => setDragging(true)}
				className={classes.separator}
			>
				{/* Visual indicator */}
				<span className={classes.grabber} />
			</div>
			<CodePanel className={classes.codepanel} context={props.context} />
		</div>
	)
}

CodeArea.displayName = "CodeArea"

export default CodeArea

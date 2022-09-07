import { FC, useRef, useState } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"
import Canvas from "../../shared/canvas"
import PropertiesPanel from "../../shared/propertiespanel"
import CodePanel from "../../shared/codepanel"
import ViewInfoPanel from "../../shared/viewinfopanel"

const Grid = component.getUtility("uesio/io.grid")

import usePanels from "./usePanels"

component.registry.registerSignals("uesio/studio.runtime", {
	TOGGLE_CODE: {
		dispatcher: (state) => !state,
		target: "codepanel",
	},
})

const LEFT_PANEL_WIDTH = 300

const Buildtime: FC<definition.BaseProps> = (props) => {
	const slideRef = useRef<HTMLDivElement>(null)
	const [setDragging, codePanelWidth] = usePanels(slideRef.current)
	const uesio = hooks.useUesio(props)

	const componentId = uesio.component.getId("codepanel")
	const [showCode] = uesio.component.useState<boolean>(componentId)
	const { context } = props

	const builderContext = context.addFrame({
		theme: "uesio/studio.default",
	})
	const canvasContext = context.addFrame({
		mediaOffset: LEFT_PANEL_WIDTH + (showCode ? codePanelWidth : 0),
	})

	return (
		<Grid
			context={context}
			styles={{
				root: {
					height: "100vh",
					gridTemplateColumns: `${LEFT_PANEL_WIDTH}px 1fr ${codePanelWidth}px`,
					gridTemplateRows: "1fr 1fr",
					...styles.getBackgroundStyles(
						{
							image: "uesio/core.whitesplash",
						},
						builderContext
					),
					padding: "6px",
					rowGap: "6px",
				},
			}}
		>
			<PropertiesPanel
				context={builderContext}
				className={styles.css({ gridRow: 1, gridColumn: 1 })}
			/>
			<ViewInfoPanel
				context={builderContext}
				className={styles.css({ gridRow: 2, gridColumn: 1 })}
			/>
			<div
				className={styles.css({
					gridRow: "1 / 3",
					gridColumn: showCode ? "2" : "2 / 4",
				})}
			>
				<Canvas context={canvasContext} children={props.children} />
			</div>
			{showCode && (
				<div
					ref={slideRef}
					className={styles.css({
						gridRow: "1 / 3",
						gridColumn: 3,
						position: "relative",
						display: "grid",
					})}
				>
					{/* Whole box, from top to down that is slidable */}
					<div
						role="seperator"
						aria-valuenow={0}
						onMouseDown={() => setDragging(true)}
						className={styles.css({
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
						})}
					>
						{/* Visual indicator */}
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
								position: "absolute",
							})}
						/>
					</div>
					<CodePanel
						className={styles.css({
							position: "relative",
							boxShadow: "0 0 19px -6px rgb(0 0 0 / 20%)",
						})}
						context={builderContext}
					/>
				</div>
			)}
		</Grid>
	)
}

export default Buildtime

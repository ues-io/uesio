import { FC, useRef } from "react"
import { definition, component, hooks, context as ctx, styles } from "@uesio/ui"
import Canvas from "../../shared/canvas"
import RightNav from "../../shared/rightnav"
import PropertiesPanel from "../../shared/propertiespanel"
import CodePanel from "../../shared/codepanel"
import ViewInfoPanel from "../../shared/viewinfopanel"

const Grid = component.getUtility("uesio/io.grid")

import usePanels from "./usePanels"

component.registry.registerSignals("uesio/studio.runtime", {
	TOGGLE_CODE: {
		dispatcher: (signal, context, getState, setState) => {
			const showCode = getState() as boolean
			setState(!showCode)
		},
		target: "codepanel",
	},
})

const NAV_WIDTH = 50
const LEFT_PANEL_WIDTH = 300

const Buildtime: FC<definition.BaseProps> = (props) => {
	const slideRef = useRef<HTMLDivElement>(null)
	const [setDragging, codePanelWidth] = usePanels(slideRef.current)
	const uesio = hooks.useUesio(props)

	const [showCode] = uesio.component.useState<boolean>("codepanel")

	const { context } = props

	const viewDef = uesio.view.useViewDef(context.getViewDefId() || "")

	const builderTheme = uesio.theme.useTheme(
		"uesio/studio.default",
		new ctx.Context()
	)
	if (!builderTheme || !viewDef) return <Canvas context={context} />

	const builderContext = context.addFrame({
		theme: "uesio/studio.default",
	})
	const canvasContext = context.addFrame({
		mediaOffset:
			NAV_WIDTH * 2 + LEFT_PANEL_WIDTH + (showCode ? codePanelWidth : 0),
	})

	return (
		<Grid
			context={context}
			styles={{
				root: {
					height: "100vh",
					gridTemplateColumns: `${LEFT_PANEL_WIDTH}px 1fr ${codePanelWidth}px ${NAV_WIDTH}px`,
					gridTemplateRows: "1fr 1fr",
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
			<Canvas
				className={styles.css({
					gridRow: "1 / 3",
					gridColumn: showCode ? "2" : "2 / 4",
				})}
				context={canvasContext}
			/>
			{showCode && (
				<div
					ref={slideRef}
					className={styles.css({
						gridRow: "1 / 3",
						gridColumn: 3,
						position: "relative",
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
							left: "-3px",
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

			<RightNav
				context={builderContext}
				className={styles.css({ gridRow: "1 / 3", gridColumn: 4 })}
			/>
		</Grid>
	)
}

export default Buildtime

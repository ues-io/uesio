import { FunctionComponent } from "react"
import { definition, hooks, component, styles } from "@uesio/ui"

const minPagePadding = "40px"

const DialogBase: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = styles.useStyles(
		{
			blocker: {
				position: "fixed",
				top: 0,
				bottom: 0,
				height: "100%",
				width: "100%",
				backdropFilter: "grayscale(50%) blur(5px) brightness(50%)",
			},
			root: {
				position: "absolute",
				top: 0,
				bottom: 0,
				height: "100%",
				width: "100%",
				display: "grid",
				gridTemplateColumns: `minmax(${minPagePadding},1fr) minmax(auto,${
					props.definition?.width || "100%"
				}) minmax(${minPagePadding},1fr)`,
				gridTemplateRows: `minmax(${minPagePadding},1fr) minmax(auto,${
					props.definition?.height || "100%"
				}) minmax(${minPagePadding},1fr)`,
				pointerEvents: "none",
			},
			inner: {
				boxShadow: "0 0 20px #0005",
				borderRadius: "4px",
				backgroundColor: "white",
				gridRow: "2 / 3",
				gridColumn: "2 / 3",
				pointerEvents: "auto",
			},
		},
		props
	)
	const uesio = hooks.useUesio(props)
	const panelId = props.definition?.id as string
	return (
		<>
			<div
				className={classes.blocker}
				onClick={uesio.signal.getHandler([
					{
						signal: "panel/TOGGLE",
						panel: panelId,
					},
				])}
			/>
			<div className={classes.root}>
				<div className={classes.inner}>{props.children}</div>
			</div>
		</>
	)
}

const PlainDialog: FunctionComponent<definition.BaseProps> = (props) => (
	<DialogBase {...props}>
		<component.Slot
			definition={props.definition}
			listName="components"
			path={props.path}
			accepts={["uesio.standalone"]}
			context={props.context}
		/>
	</DialogBase>
)

export { DialogBase }

export default PlainDialog

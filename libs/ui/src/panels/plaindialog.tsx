import { FunctionComponent } from "react"
import { createUseStyles } from "react-jss"
import { BaseProps } from "../definition/definition"
import { Context } from "../context/context"
import Slot from "../components/slot"

const minPagePadding = "40px"

const useStyles = createUseStyles({
	blocker: {
		position: "fixed",
		top: 0,
		bottom: 0,
		height: "100%",
		width: "100%",
		backdropFilter: "grayscale(50%) blur(5px) brightness(50%)",
	},
	root: (props: DialogProps) => ({
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
	}),
	inner: {
		boxShadow: "0 0 20px #0005",
		borderRadius: "4px",
		backgroundColor: "white",
		gridRow: "2 / 3",
		gridColumn: "2 / 3",
		pointerEvents: "auto",
	},
})

type DialogProps = {
	close: () => Promise<Context>
} & BaseProps

const DialogBase: FunctionComponent<DialogProps> = (props) => {
	const classes = useStyles(props)
	const { close } = props
	return (
		<>
			<div className={classes.blocker} onClick={close} />
			<div className={classes.root}>
				<div className={classes.inner}>{props.children}</div>
			</div>
		</>
	)
}

const PlainDialog: FunctionComponent<DialogProps> = (props) => (
	<DialogBase {...props}>
		<Slot
			definition={props.definition}
			listName="components"
			path={props.path}
			accepts={["uesio.standalone"]}
			context={props.context}
		/>
	</DialogBase>
)

export { DialogBase, DialogProps }

export default PlainDialog

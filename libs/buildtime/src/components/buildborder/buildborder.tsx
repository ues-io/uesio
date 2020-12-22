import { FunctionComponent, MouseEvent } from "react"
import clsx from "clsx"
import { material } from "@uesio/ui"

const ACTIVE_COLOR = "#eee"
const SELECTED_COLOR = "#aaa"

const getColor = (props: Props): string =>
	props.isSelected ? SELECTED_COLOR : ACTIVE_COLOR
const getOutline = (props: Props): string =>
	props.isActive || props.isSelected ? "1px solid " + getColor(props) : "none"
const getBackgroundColor = (props: Props): string =>
	props.isSelected ? "white" : "transparent"

const useStyles = material.makeStyles((theme) => ({
	mask: {
		outline: getOutline,
		boxShadow: (props: Props): string =>
			props.isSelected ? theme.shadows[3] : theme.shadows[0],
		backgroundColor: getBackgroundColor,
		/*
		"&:hover": {
			outline: getOutline,
		},
		"&:hover::after": titleTag,
		*/
	},
	maskExpanded: {
		backgroundColor: getBackgroundColor,
		outline: (props: Props): string =>
			props.isSelected ? getOutline(props) : "",
		border: (props: Props): string =>
			props.isSelected
				? "1px solid transparent"
				: `1px solid ${props.isActive ? SELECTED_COLOR : ACTIVE_COLOR}`,
		boxShadow: (props: Props): string =>
			props.isSelected ? theme.shadows[3] : theme.shadows[0],
	},
	/*
	isSelected: {
		"&::after": titleTag,
	},
	isActive: {
		"&::after": titleTag,
	},
	*/
	header: {
		boxShadow: (props: Props): string =>
			props.isSelected ? theme.shadows[3] : theme.shadows[0],
		outline: getOutline,
		position: "absolute",
		top: "-24px",
		left: "0px",
		fontSize: "9pt",
		textTransform: "uppercase",
		color: "#333",
		padding: "8px 8px 0px 10px",
		opacity: 0.95,
		fontWeight: "bold",
		backgroundColor: getBackgroundColor,
		width: "100%",
		"&::after": {
			height: "7px",
			width: "100%",
			backgroundColor: "white",
			content: "''",
			position: "absolute",
			bottom: "-7px",
			left: "0",
		},
	},
	headerExpanded: {
		color: "#333",
		fontWeight: "bold",
		padding: "8px 8px 4px 10px",
		textTransform: "uppercase",
		fontSize: "9pt",
	},
}))

interface Props {
	onClick?: (event: MouseEvent) => void
	onMouseEnter?: (event: MouseEvent) => void
	onMouseLeave?: (event: MouseEvent) => void
	setDragging?: (event: MouseEvent) => void
	isSelected?: boolean
	isActive?: boolean
	title?: string
	isExpanded: boolean
}

const BuildBorder: FunctionComponent<Props> = (props) => {
	const {
		onClick,
		onMouseEnter,
		onMouseLeave,
		isSelected,
		setDragging,
		isActive,
		isExpanded,
		children,
		title,
	} = props
	const classes = useStyles(props)
	const wrapperClass = clsx({
		[classes.maskExpanded]: isExpanded,
		[classes.mask]: (isActive || isSelected) && !isExpanded,
	})
	const headerClass = isExpanded ? classes.headerExpanded : classes.header
	return (
		<div
			className={wrapperClass}
			// Using MouseDown here instead of Click because of weirdness
			// with propagation.
			onMouseDown={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{(isSelected || isExpanded) && (
				<div onMouseDown={setDragging} className={headerClass}>
					{title}
				</div>
			)}
			{children}
		</div>
	)
}

export default BuildBorder

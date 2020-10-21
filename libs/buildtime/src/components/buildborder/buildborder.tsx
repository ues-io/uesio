import React, { ReactElement, MouseEvent, ReactNode } from "react"
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

type Props = {
	onClick?: (event: MouseEvent) => void
	onMouseEnter?: (event: MouseEvent) => void
	onMouseLeave?: (event: MouseEvent) => void
	setDragging?: (event: MouseEvent) => void
	isSelected?: boolean
	isActive?: boolean
	title?: string
	children?: ReactNode
	isExpanded: boolean
}

function BuildBorder(props: Props): ReactElement {
	const classes = useStyles(props)
	const isExpanded = props.isExpanded
	const wrapperClass =
		props.isActive || props.isSelected || isExpanded
			? isExpanded
				? classes.maskExpanded
				: classes.mask
			: ""
	const headerClass = isExpanded ? classes.headerExpanded : classes.header
	return (
		<div
			{...{
				className: wrapperClass,
				// Using MouseDown here instead of Click because of weirdness
				// with propagation.
				onMouseDown: props.onClick,
				onMouseEnter: props.onMouseEnter,
				onMouseLeave: props.onMouseLeave,
			}}
		>
			{(props.isSelected || isExpanded) && (
				<div onMouseDown={props.setDragging} className={headerClass}>
					{props.title}
				</div>
			)}
			{props.children}
		</div>
	)
}

export default BuildBorder

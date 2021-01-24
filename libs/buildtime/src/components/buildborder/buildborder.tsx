import React, { FunctionComponent, MouseEvent } from "react"
import clsx from "clsx"
import { material } from "@uesio/ui"

const ACTIVE_COLOR = "#eee"
const SELECTED_COLOR = "#aaa"

interface Props {
	onClick?: (event: MouseEvent) => void
	onDragStart?: (event: MouseEvent) => void
	onMouseEnter?: (event: MouseEvent) => void
	onMouseLeave?: (event: MouseEvent) => void
	startDragging?: (event: MouseEvent) => void
	isSelected?: boolean
	isActive?: boolean
	title?: string
	isStructureView: boolean
}

const getColor = ({ isSelected }: Props) =>
	isSelected ? SELECTED_COLOR : ACTIVE_COLOR
const getOutline = (props: Props) =>
	props.isActive || props.isSelected ? `1px solid ${getColor(props)}` : "none"
const getBackgroundColor = ({ isSelected }: Props) =>
	isSelected ? "white" : "transparent"

const useStyles = material.makeStyles((theme) => ({
	mask: {
		outline: getOutline,
		boxShadow: ({ isSelected }: Props) =>
			isSelected ? theme.shadows[3] : theme.shadows[0],
		backgroundColor: getBackgroundColor,
		/*
		"&:hover": {
			outline: getOutline,
		},
		"&:hover::after": titleTag,
		*/
	},
	maskStructureView: {
		backgroundColor: getBackgroundColor,
		outline: (props: Props) => (props.isSelected ? getOutline(props) : ""),
		border: ({ isSelected, isActive }: Props) =>
			isSelected
				? "1px solid transparent"
				: `1px solid ${isActive ? SELECTED_COLOR : ACTIVE_COLOR}`,
		boxShadow: ({ isSelected }: Props) =>
			isSelected ? theme.shadows[3] : theme.shadows[0],
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
		boxShadow: ({ isSelected }: Props) =>
			isSelected ? theme.shadows[3] : theme.shadows[0],
		outline: getOutline,
		position: "absolute",
		top: "-24px",
		left: 0,
		fontSize: "9pt",
		textTransform: "uppercase",
		color: "#333",
		padding: "8px 8px 0 10px",
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
			left: 0,
		},
	},
	headerStructureView: {
		color: "#333",
		fontWeight: "bold",
		padding: "8px 8px 4px 10px",
		textTransform: "uppercase",
		fontSize: "9pt",
	},
}))

const BuildBorder: FunctionComponent<Props> = (props) => {
	const {
		onClick,
		onMouseEnter,
		onMouseLeave,
		isSelected,
		startDragging,
		isActive,
		isStructureView,
		children,
		title,
	} = props
	const classes = useStyles(props)
	const wrapperClass = clsx({
		[classes.maskStructureView]: isStructureView,
		[classes.mask]: (isActive || isSelected) && !isStructureView,
	})
	const headerClass = isStructureView
		? classes.headerStructureView
		: classes.header
	return (
		<div
			className={wrapperClass}
			// Using MouseDown here instead of Click because of weirdness
			// with propagation.
			onMouseDown={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{(isSelected || isStructureView) && (
				<div onMouseDown={startDragging} className={headerClass}>
					{title}
				</div>
			)}
			{children}
		</div>
	)
}

export default BuildBorder

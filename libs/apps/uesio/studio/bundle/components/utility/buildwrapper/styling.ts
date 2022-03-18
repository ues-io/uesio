import { CSSInterpolation } from "@emotion/css"

export default (
	isSelected: boolean,
	isActive: boolean,
	isDraggingMe: boolean
): Record<string, CSSInterpolation> => {
	const SELECTED_COLOR = "#aaa"
	const HOVER_COLOR = "#aaaaaaae"
	const INACTIVE_COLOR = "#eee"

	const borderColor = (() => {
		if (isSelected) return SELECTED_COLOR
		if (isActive) return HOVER_COLOR
		return INACTIVE_COLOR
	})()

	return {
		root: {
			cursor: "pointer",
			position: "relative",
			userSelect: "none",
			border: `1px solid ${borderColor}`,
			marginTop: "-1px",
			zIndex: isSelected ? 1 : 0,
			transition: "all 0.18s ease",
			"&:hover": {
				zIndex: 1,
			},
			...(isDraggingMe && {
				display: "none",
			}),
		},
		placeholder: {
			minWidth: "40px",
			minHeight: "40px",
			border: "1px dashed #ccc",
			backgroundColor: "#e5e5e5",
		},
		afterPlaceholder: {
			display: "none",
			"&:last-child": {
				display: "block",
			},
		},
		header: {
			color: "#333",
			backgroundColor: isSelected ? "white" : "transparent",
			padding: "10px 10px 2px",
			textTransform: "uppercase",
			fontSize: "8pt",
		},
		inner: {
			padding: "8px",
			position: "relative",
			overflow: "auto",
		},
	}
}

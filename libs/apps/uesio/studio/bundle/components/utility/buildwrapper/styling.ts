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
			zIndex: isSelected ? 1 : 0,
			transition: "all 0.18s ease",
			"&:hover": {
				zIndex: 1,
			},
			...(isDraggingMe && {
				display: "none",
			}),
			padding: "6px",
		},
		wrapper: {
			border: `1px solid ${borderColor}`,
			borderRadius: "4px",
			overflow: "hidden",
		},
		placeholder: {
			padding: "6px",
		},
		placeholderInner: {
			minWidth: "40px",
			minHeight: "40px",
			borderRadius: "4px",
			border: "1px dashed #ccc",
			backgroundColor: "#e5e5e5",
			height: "100%",
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
		popper: {
			width: "auto",
			border: "1px solid #ddd",
			borderRadius: "8px",
			boxShadow: "0 0 12px #00000033",
		},
		popperInner: {
			borderRadius: "7px",
		},
		inner: {
			padding: "8px",
			position: "relative",
			overflow: "auto",
		},
		titleicon: {
			marginRight: "4px",
		},
		titletext: {
			verticalAlign: "middle",
		},
	}
}

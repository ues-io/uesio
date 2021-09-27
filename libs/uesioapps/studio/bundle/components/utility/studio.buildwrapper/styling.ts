import { CSSInterpolation } from "@emotion/css"

export default (
	isSelected: boolean,
	isActive: boolean,
	isStructureView: boolean,
	isContentView: boolean,
	isDraggingMe: boolean
): Record<string, CSSInterpolation> => {
	const ACTIVE_COLOR = "#eee"
	const SELECTED_COLOR = "#aaa"
	const HOVER_COLOR = "#aaaaaaae"
	const INACTIVE_COLOR = "#eee"

	const borderColor = (() => {
		if (isSelected) return SELECTED_COLOR
		if (isActive) return HOVER_COLOR
		return INACTIVE_COLOR
	})()
	const deepShadow =
		"0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)"

	return {
		root: {
			cursor: "pointer",
			position: "relative",
			userSelect: "none",
			gap: "inherit",
			...(isStructureView && {
				border: `1px solid ${borderColor}`,
				marginTop: "-1px",
				zIndex: isSelected ? 1 : 0,
				transition: "all 0.18s ease",
				"&:hover": {
					zIndex: 1,
				},
			}),
			...(isContentView && {
				position: "relative",
			}),
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
			fontWeight: "bold",
			backgroundColor: isSelected ? "white" : "transparent",
			padding: "10px",
			textTransform: "uppercase",
			fontSize: "9pt",
			...(isContentView && {
				boxShadow: isSelected ? deepShadow : "none",
				outline:
					isActive || isSelected
						? `1px solid ${
								isSelected ? SELECTED_COLOR : ACTIVE_COLOR
						  }`
						: "none",
				position: "absolute",
				top: "-34px",
				left: "-8px",
				right: "-8px",
				bottom: "-8px",
			}),
		},
		inner: {
			...(isStructureView && {
				padding: "8px",
				gap: "inherit",
			}),
			position: "relative",
			// overflow: "auto",
		},
	}
}

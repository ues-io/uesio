import React, { FC } from "react"
import MiniToolbar from "./minitoolbar"
import MiniToolbarButton from "./minitoolbarbutton"
import WireIcon from "@material-ui/icons/Power"
import ComponentsIcon from "@material-ui/icons/Widgets"
import BorderOuterIcon from "@material-ui/icons/BorderOuter"
import BorderClearIcon from "@material-ui/icons/BorderClear"
import { Divider } from "@material-ui/core"

type Props = {
	viewMode: string
	onChange: (toolbarId: string) => void
}

const MINI_TOOLBAR_WIDTH = 50

const LeftNavbar: FC<Props> = (props: Props) => {
	return (
		<MiniToolbar
			{...{
				anchor: "left",
				width: MINI_TOOLBAR_WIDTH,
			}}
		>
			<MiniToolbarButton
				{...{
					id: "wires",
					icon: WireIcon,
					onClick: props.onChange,
					title: "Wires",
					tooltipPlacement: "right",
				}}
			/>
			<MiniToolbarButton
				{...{
					id: "components",
					icon: ComponentsIcon,
					onClick: props.onChange,
					title: "Components",
					tooltipPlacement: "right",
				}}
			/>
			<Divider
				style={{
					margin: "8px 8px 0 8px",
				}}
			/>
			{props.viewMode === "expandedview" && (
				<MiniToolbarButton
					{...{
						id: "compactview",
						icon: BorderClearIcon,
						onClick: props.onChange,
						title: "Switch To Compact View",
						tooltipPlacement: "right",
					}}
				/>
			)}
			{props.viewMode !== "expandedview" && (
				<MiniToolbarButton
					{...{
						id: "expandedview",
						icon: BorderOuterIcon,
						onClick: props.onChange,
						title: "Switch To Expanded View",
						tooltipPlacement: "right",
					}}
				/>
			)}
		</MiniToolbar>
	)
}

export default LeftNavbar

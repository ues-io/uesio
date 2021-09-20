import { FunctionComponent, useState } from "react"
import { PropRendererProps } from "./proprendererdefinition"

import { hooks, component, styles, materialIcons } from "@uesio/ui"
//import { materialIcons } from "./materialicons"

const TextField = component.registry.getUtility("io.textfield")
const Popper = component.registry.getUtility("io.popper")
const IconButton = component.registry.getUtility("io.iconbutton")
const TitleBar = component.registry.getUtility("io.titlebar")

const IconProp: FunctionComponent<PropRendererProps> = (props) => {
	const { descriptor, path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedNode] =
		uesio.builder.useSelectedNode()

	const iconPanePath = `${path}["iconsPane"]["0"]`
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const selected = selectedNode.startsWith(iconPanePath)
	const [searchTerm, setSearchTerm] = useState("")
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const results = !searchTerm
		? materialIcons
		: materialIcons.filter((icon) =>
				icon.toLowerCase().includes(searchTerm.toLocaleLowerCase())
		  )

	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
			},
			icons: {
				display: "grid",
				flexWrap: "wrap",
				overflow: "scroll",
				maxHeight: "350px",
				gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
				padding: "16px",
				rowGap: "14px",
			},
			buttons: {
				marginTop: "20px",
			},
			search: {
				marginBottom: "2px",
				width: "100%",
				height: "30px",
				outline: 0,
				borderWidth: "0 0 1px",
				padding: "16px 8px",
			},
		},
		null
	)

	return (
		<div ref={setAnchorEl} className={classes.root}>
			<TextField
				value={valueAPI.get(path)}
				label={descriptor.label}
				setValue={(value: string) => valueAPI.set(path, value)}
				context={context}
			/>
			<div className={classes.buttons}>
				<IconButton
					icon={valueAPI.get(path)}
					context={context}
					variant="studio.iconbutton"
				/>
			</div>
			<div className={classes.buttons}>
				<IconButton
					icon="launch"
					context={context}
					variant="studio.iconbutton"
					onClick={(): void =>
						uesio.builder.setSelectedNode(
							metadataType,
							metadataItem,
							iconPanePath
						)
					}
				/>
			</div>

			{selected && anchorEl && (
				<Popper
					referenceEl={anchorEl}
					context={context}
					placement="right"
				>
					<TitleBar
						title={"Icons"}
						variant="io.primary"
						subtitle={"Material Icons"}
						actions={
							props.path && (
								<IconButton
									context={context}
									variant="io.small"
									icon="close"
									onClick={
										() => uesio.builder.clearSelectedNode() //TO-DO keep the button (parent path selected)
									}
								/>
							)
						}
						context={context}
					/>
					<input
						className={classes.search}
						value={searchTerm}
						onChange={handleChange}
						type="search"
						placeholder="Search..."
					/>
					<div className={classes.icons}>
						{results.map((iconName) => (
							<IconButton
								icon={iconName}
								context={context}
								variant="studio.iconbuttongrid"
								onClick={(): void =>
									valueAPI.set(path, iconName)
								}
							/>
						))}
					</div>
				</Popper>
			)}
		</div>
	)
}

export default IconProp

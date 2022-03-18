import { ChangeEvent, FunctionComponent, useState } from "react"

import { hooks, component, styles, materialIcons, builder } from "@uesio/ui"

const TextField = component.registry.getUtility("uesio/io.textfield")
const Popper = component.registry.getUtility("uesio/io.popper")
const IconButton = component.registry.getUtility("uesio/io.iconbutton")
const TitleBar = component.registry.getUtility("uesio/io.titlebar")
const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")

const IconProp: FunctionComponent<builder.PropRendererProps> = (props) => {
	const { descriptor, path, context, valueAPI } = props

	const uesio = hooks.useUesio(props)
	const [, , selectedNode] = uesio.builder.useSelectedNode()
	const selected = selectedNode === path

	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

	const [searchTerm, setSearchTerm] = useState("")
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const results = !searchTerm
		? materialIcons
		: materialIcons.filter((icon) =>
				icon.toLowerCase().includes(searchTerm.toLocaleLowerCase())
		  )

	const classes = styles.useUtilityStyles(
		{
			icons: {
				display: "grid",
				overflow: "auto",
				maxHeight: "350px",
				gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
				padding: "16px",
				rowGap: "14px",
			},
			search: {
				marginBottom: "2px",
				width: "100%",
				height: "30px",
				outline: 0,
				borderWidth: "0 0 1px",
				padding: "16px 8px",
			},
			iconfield: {
				display: "grid",
				gridTemplateColumns: "1fr min-content",
				alignItems: "center",
				columnGap: "8px",
			},
			iconpreview: {
				backgroundColor: "#f0f0f0",
				padding: "6px",
				borderRadius: "20px",
				fontSize: "8pt",
			},
		},
		null
	)

	const viewDefId = uesio.getViewDefId()
	if (!viewDefId || !path) return null

	return (
		<div ref={setAnchorEl}>
			<FieldWrapper
				labelPosition="left"
				label={descriptor.label}
				context={context}
				variant="studio.propfield"
			>
				<div className={classes.iconfield}>
					<TextField
						value={valueAPI.get(path)}
						label={descriptor.label}
						setValue={(value: string) => valueAPI.set(path, value)}
						context={context}
						variant="studio.propfield"
					/>
					<IconButton
						className={classes.iconpreview}
						icon={valueAPI.get(path) || ""}
						context={context}
						onClick={() => {
							uesio.builder.setSelectedNode(
								"viewdef",
								viewDefId,
								path
							)
						}}
					/>
				</div>
			</FieldWrapper>

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
									variant="studio.buildtitle"
									icon="close"
									onClick={() => uesio.builder.unSelectNode()}
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
								key={iconName}
								icon={iconName}
								context={context}
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

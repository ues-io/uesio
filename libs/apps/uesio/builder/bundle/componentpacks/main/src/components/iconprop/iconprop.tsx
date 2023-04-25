import { ChangeEvent, useState } from "react"
import { component, styles, definition } from "@uesio/ui"
import { setSelectedPath, useSelectedPath } from "../../api/stateapi"
import { FullPath } from "../../api/path"
import { IconProperty } from "../../properties/componentproperty"
import { materialIcons } from "../../icons/materialicons"

type Definition = {
	property: IconProperty
	path: FullPath
}

const StyleDefaults = Object.freeze({
	icons: {
		display: "grid",
		overflow: "auto",
		gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
		padding: "16px",
		rowGap: "14px",
		background: "white",
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
})

const IconProp: definition.UC<Definition> = (props) => {
	const { context, definition } = props
	const { path, property } = definition

	const TextField = component.getUtility("uesio/io.textfield")
	const Popper = component.getUtility("uesio/io.popper")
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")

	const iconPropPath = path.addLocal(property.name)
	const selectedPath = useSelectedPath(context)
	const selected = iconPropPath.equals(selectedPath)

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

	const classes = styles.useUtilityStyles(StyleDefaults, props)

	const viewDefId = context.getViewDefId()
	const record = context.getRecord()
	if (!viewDefId || !record) return null

	const icon = record.getFieldValue(property.name)

	return (
		<div ref={setAnchorEl}>
			<FieldWrapper
				labelPosition="left"
				label={property?.label}
				context={context}
				variant="uesio/builder.propfield"
			>
				<div className={classes.iconfield}>
					<TextField
						value={icon || ""}
						label={property?.label}
						setValue={(value: string) => {
							record.update(property.name, value, context)
						}}
						context={context}
						variant="uesio/builder.propfield"
					/>
					<IconButton
						className={classes.iconpreview}
						icon={icon || "add"}
						context={context}
						onClick={() => {
							setSelectedPath(context, iconPropPath)
						}}
					/>
				</div>
			</FieldWrapper>

			{selected && anchorEl && (
				<Popper
					referenceEl={anchorEl}
					matchHeight
					context={context}
					offset={6}
					placement="right-start"
					autoPlacement={["right-start"]}
					useFirstRelativeParent
				>
					<ScrollPanel
						variant="uesio/builder.mainsection"
						header={
							<>
								<TitleBar
									title={"Icons"}
									variant="uesio/builder.primary"
									subtitle={"Material Icons"}
									actions={
										<IconButton
											context={context}
											variant="uesio/builder.buildtitle"
											icon="close"
											onClick={() =>
												setSelectedPath(context, path)
											}
										/>
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
							</>
						}
						context={context}
					>
						<div className={classes.icons}>
							{results.map((iconName) => (
								<IconButton
									key={iconName}
									icon={iconName}
									context={context}
									onClick={(): void => {
										record.update(
											property.name,
											iconName,
											context
										)
									}}
								/>
							))}
						</div>
					</ScrollPanel>
				</Popper>
			)}
		</div>
	)
}

export default IconProp

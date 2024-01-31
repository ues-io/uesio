import { useState } from "react"
import { component, styles, definition } from "@uesio/ui"
import { setSelectedPath, useSelectedPath } from "../../api/stateapi"
import { FullPath } from "../../api/path"
import { IconProperty } from "../../properties/componentproperty"
import { materialIcons } from "../../icons/materialicons"
import PropertiesWrapper from "../mainwrapper/propertiespanel/propertieswrapper"

type Definition = {
	property: IconProperty
	path: FullPath
}

const StyleDefaults = Object.freeze({
	icons: ["grid", "overflow-auto", "grid-cols-6", "p-4", "gap-4"],
	iconfield: ["grid", "grid-cols-[1fr_min-content]", "items-center", "gap-2"],
	iconpreview: ["bg-slate-100", "p-2", "rounded-full", "text-xs"],
})

const IconProp: definition.UC<Definition> = (props) => {
	const { context, definition } = props
	const { path, property } = definition

	const TextField = component.getUtility("uesio/io.textfield")
	const Popper = component.getUtility("uesio/io.popper")
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

	const iconPropPath = path.addLocal(property.name)
	const selectedPath = useSelectedPath(context)
	const selected = iconPropPath.equals(selectedPath)

	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

	const [searchTerm, setSearchTerm] = useState("")

	const results = !searchTerm
		? materialIcons
		: materialIcons.filter((icon) =>
				icon.toLowerCase().includes(searchTerm.toLocaleLowerCase())
			)

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

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
						onClick={(e: MouseEvent) => {
							e.stopPropagation()
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
					parentSelector="#propertieswrapper"
				>
					<PropertiesWrapper
						title="Select an Icon"
						path={iconPropPath}
						context={context}
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						onUnselect={() => setSelectedPath(context, path)}
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
					</PropertiesWrapper>
				</Popper>
			)}
		</div>
	)
}

export default IconProp

import { FC } from "react"
import { definition, hooks, component, wire, styles } from "@uesio/ui"

const CheckboxField = component.registry.getUtility("io.checkboxfield")
const TitleBar = component.registry.getUtility("io.titlebar")
const Icon = component.registry.getUtility("io.icon")
const Button = component.registry.getUtility("io.button")

interface T extends definition.BaseProps {
	wireName: string
	collectionName: string
}

const FieldsPermissionPicker: FC<T> = (props) => {
	const { context, wireName, collectionName } = props

	const uesio = hooks.useUesio(props)
	const record = context.getRecord()

	const { workspacename, appname } = context.getView()?.params || {}
	const wire = uesio.wire.useWire(wireName || "")

	if (!wire || !record || !workspacename || !appname) return null

	const nameNameField = wire.getCollection().getNameField()?.getId()
	if (!nameNameField) return null

	const mode = context.getFieldMode() || "READ"
	const value = record.getFieldValue<
		Record<string, Record<string, boolean> | boolean> | undefined
	>("studio.collectionrefs")
	const disabled = mode === "READ"

	const fields = wire
		.getData()
		.filter(
			(f) => f.source && f.source["studio.collection"] === collectionName
		)

	if (!value) return null

	// A collection key's value can be either false or Record<string, boolean>
	const getValue = (itemName: string) => {
		const x = value[collectionName] as Record<string, boolean> | boolean
		const r = typeof x === "boolean" ? false : x[itemName]

		return r
	}

	const getUpdateBody = (
		currentValue: wire.PlainWireRecord,
		fieldKey: string,
		hasPermission: boolean
	) => ({
		...currentValue,
		[collectionName]: {
			...(currentValue[collectionName] as Record<string, boolean>),
			[fieldKey]: hasPermission,
		},
	})

	const updateSingle = (fieldKey: string, hasPermission: boolean) =>
		record.update(
			"studio.collectionrefs",
			getUpdateBody(value, fieldKey, hasPermission)
		)

	const handleToggle = (fieldKey: string) =>
		updateSingle(
			fieldKey,
			getValue(fieldKey)
				? !(value[collectionName] as Record<string, boolean>)[fieldKey]
				: true
		)

	const updateAll = (newVal: boolean) =>
		record.update(
			"studio.collectionrefs",
			fields.reduce(
				(
					acc: Record<string, Record<string, boolean>>,
					v: wire.WireRecord
				) => {
					const fieldKey = `${appname}.${v.source["studio.name"]}`
					return getUpdateBody(acc, fieldKey, newVal)
				},
				value
			)
		)

	const classes = styles.useUtilityStyles(
		{
			root: {},
			toolbar: {
				padding: "8px 3px 8px 0",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				borderBottom: "1px solid #eee",
				fontWeight: 700,
			},
			btn: {
				fontSize: "1em",
				color: uesio.getTheme().definition.palette.primary,
			},
		},
		props
	)

	const fieldKeys = fields.map((v) => `${appname}.${v.source["studio.name"]}`)
	const selectedFieldKeys = Object.entries(value[collectionName])
		.filter(([, value]) => value)
		.map(([el]) => el)

	const allFieldsAreSelected = fieldKeys.every((v) =>
		selectedFieldKeys.includes(v)
	)

	return (
		<>
			{/* {fields.length > 6 && mode === "EDIT" && ( */}
			<div className={classes.toolbar}>
				<span>Fields</span>
				{!disabled && (
					<Button
						onClick={() => updateAll(!allFieldsAreSelected)}
						context={props.context}
						className={classes.btn}
						icon={
							<Icon
								icon={
									allFieldsAreSelected
										? "check_box"
										: "check_box_outline_blank"
								}
								context={props.context}
							/>
						}
					>
						select all
					</Button>
				)}
			</div>
			{/* )} */}
			{fields.map((f: wire.WireRecord, i: number) => {
				const fieldName = appname + "." + f.source["studio.name"]
				return (
					<TitleBar
						key={`${fieldName}.${i}`}
						context={context}
						title={fieldName}
						variant="studio.permission"
						onClick={() => handleToggle(fieldName)}
						actions={
							<CheckboxField
								context={context}
								disabled={disabled}
								setValue={() => handleToggle(fieldName)}
								value={!!getValue(fieldName)}
								mode={mode}
							/>
						}
					/>
				)
			})}
		</>
	)
}

export default FieldsPermissionPicker

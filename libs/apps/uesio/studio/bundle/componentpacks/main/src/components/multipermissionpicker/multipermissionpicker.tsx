import { definition, api, component, wire, signal } from "@uesio/ui"
import omit from "lodash/omit"

type PermissionFieldDefinition = wire.FieldMetadata

type MultiPermissionPickerDefinition = {
	fieldId: string
	wireName: string
	permissionFields: PermissionFieldDefinition[]
	rowactions?: RowAction[]
}

type RowAction = {
	text: string
	signals: signal.SignalDefinition[]
	type?: "DEFAULT"
}

const MultiPermissionPicker: definition.UC<MultiPermissionPickerDefinition> = (
	props
) => {
	const ID_FIELD = "uesio/core.id"
	const NAME_FIELD = "uesio/studio.name"
	const NAMESPACE_FIELD = "uesio/studio.namespace"
	const {
		context,
		path,
		definition: { wireName, permissionFields, rowactions },
	} = props
	const fieldId = context.mergeString(props.definition.fieldId)
	const uesioId =
		props.definition[component.COMPONENT_ID] ||
		"multipermissionpicker" + fieldId
	const dynamicTableId = uesioId + "-table"

	const mode = context.getFieldMode() || "READ"

	const DynamicTable = component.getUtility("uesio/io.dynamictable")

	const permsStorageRecord = context.getRecord()

	const wire = api.wire.useWire(wireName || "", context)

	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No workspace context provided")

	if (!wire || !permsStorageRecord) {
		return null
	}

	const collection = wire.getCollection()
	const nameField = collection.getNameField()
	const nameNameField = nameField?.getId()
	if (!nameNameField) return null
	// This field will contain the permissions data as a map of values,
	// where each key is one of the permissionsFields and the value is a boolean
	const getDataValue = () =>
		permsStorageRecord.getFieldValue<wire.PlainWireRecord>(fieldId) || {}
	const updateDataValue = (newValue: wire.PlainWireRecord) =>
		permsStorageRecord.update(fieldId, newValue, context)
	const getPermRecord = (recordId: string) => {
		const existingPerms = getDataValue()[recordId] as Record<
			string,
			boolean
		>
		const [namespace, name] = component.path.parseKey(recordId)
		const itemPerms = {} as Record<string, wire.PlainFieldValue>
		// ensure all perm fields are set with a default
		permissionFields.forEach(({ name, type }) => {
			if (type === "CHECKBOX") {
				// backwards compatibility --- perms may be a single boolean, so apply this boolean value to all fields
				const defaultValue =
					typeof existingPerms === "boolean" ? existingPerms : false
				const existingPermValue =
					typeof existingPerms === "object"
						? existingPerms[name]
						: undefined
				itemPerms[name] =
					typeof existingPermValue === "boolean"
						? existingPermValue
						: defaultValue
				return
			}
			if (existingPerms && name in existingPerms) {
				itemPerms[name] = existingPerms[name]
			}
		})
		itemPerms[ID_FIELD] = recordId
		itemPerms[NAME_FIELD] = name
		itemPerms[NAMESPACE_FIELD] = namespace

		return itemPerms
	}

	const permsDataValue = getDataValue()

	// The list of records that may have permissions attached
	const itemsData = wire.getData()

	if (!permsDataValue) return null

	const handlePermUpdate = (
		field: string,
		value: boolean,
		recordId: string
	) => {
		const recordPerms = getPermRecord(recordId)
		recordPerms[field] = value
		updateDataValue({
			...getDataValue(),
			[recordId]: omit(recordPerms, ID_FIELD),
		} as wire.PlainWireRecord)
	}

	const getInitialValues = itemsData.reduce((acc, record) => {
		const itemName =
			record.getFieldValue("uesio/studio.namespace") +
			"." +
			record.getFieldValue(nameNameField)
		return {
			...acc,
			[itemName]: getPermRecord(itemName),
		}
	}, {})

	const tableFields = [
		{
			name: ID_FIELD,
			type: "TEXT",
			label: collection.getLabel(),
		},
		{
			name: NAME_FIELD,
			type: "TEXT",
			label: "Name",
		},
		{
			name: NAMESPACE_FIELD,
			type: "TEXT",
			label: "Namespace",
		},
	].concat(permissionFields)

	return (
		<DynamicTable
			id={dynamicTableId}
			context={context.deleteWorkspace()}
			path={path}
			mode={mode}
			fields={tableFields.reduce((acc, field) => ({
				...acc,
				[field.name]: field,
			}))}
			columns={tableFields
				.filter(
					(field) =>
						field.type !== "MAP" &&
						field.name !== NAME_FIELD &&
						field.name !== NAMESPACE_FIELD
				)
				.map((field) => ({
					field: field.name,
				}))}
			initialValues={getInitialValues}
			onUpdate={handlePermUpdate}
			rowactions={rowactions}
		/>
	)
}

export default MultiPermissionPicker

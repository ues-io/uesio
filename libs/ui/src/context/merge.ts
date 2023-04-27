import Wire from "../bands/wire/class"
import { getURLFromFullName, getUserFileURL } from "../hooks/fileapi"
import { PlainWireRecord } from "../bands/wirerecord/types"
import WireRecord from "../bands/wirerecord/class"
import { ID_FIELD, UPDATED_AT_FIELD } from "../collectionexports"
import { Context } from "./context"
import { getStaticAssetsPath } from "../hooks/platformapi"
import { UserState } from "../bands/user/types"
import get from "lodash/get"
import { SiteState } from "../bands/site"

type MergeType =
	| "Record"
	| "Param"
	| "User"
	| "Time"
	| "Date"
	| "RecordMeta"
	| "Theme"
	| "File"
	| "UserFile"
	| "Site"
	| "Label"
	| "SelectList"
	| "Sum"
	| "StaticFile"
	| "SignalOutput"
	| "ComponentOutput"

type MergeHandler = (expression: string, context: Context) => string

const handlers: Record<MergeType, MergeHandler> = {
	Record: (fullExpression, context) => {
		const expressionParts = fullExpression.split(":")
		let record: WireRecord | undefined
		let expression = fullExpression
		if (expressionParts.length === 1) {
			record = context.getRecord()
		} else {
			const wirename = expressionParts[0]
			const wire = context.getWire(wirename)
			record = wire?.getFirstRecord()
			expression = expressionParts[1]
		}
		const value = record?.getFieldValue(expression)
		return value !== undefined && value !== null ? `${value}` : ""
	},
	Sum: (fullExpression, context) => {
		const expressionParts = fullExpression.split(":")
		let wire: Wire | undefined
		let expression = fullExpression
		if (expressionParts.length === 1) {
			wire = context.getWire()
		} else {
			const wirename = expressionParts[0]
			wire = context.getWire(wirename)
			expression = expressionParts[1]
		}

		let total = 0
		wire?.getData().forEach((record) => {
			total += (record.getFieldValue(expression) as number) || 0
		})
		return "" + total
	},
	Param: (expression, context) => context.getParam(expression) || "",
	SignalOutput: (expression, context) => {
		// Expression MUST have 2+ parts, e.g. $SignalOutput{[stepId][propertyPath]}
		const parts = expression.split("][")
		if (parts.length !== 2) {
			throw "Invalid SignalOutput merge - a stepId and propertyPath must be provided, e.g. $SignalOutput{[stepId][propertyPath]}"
		}
		const [label, propertyPath] = parts
		const trimmedLabel = label.substring(1)
		const signalOutputFrame = context.getSignalOutputs(trimmedLabel)
		if (!signalOutputFrame) {
			throw (
				"Could not find signal output associated with label: " +
				trimmedLabel
			)
		}
		return get(
			signalOutputFrame.data,
			propertyPath.substring(0, propertyPath.length - 1)
		)
	},
	ComponentOutput: (expression, context) => {
		// Expression MUST have 2+ parts, e.g. $ComponentOutput{[componentType][property]}
		const parts = expression.split("][")
		if (parts.length !== 2) {
			throw "Invalid ComponentOutput merge - a componentType and property must be provided, e.g. $ComponentOutput{[componentType][propertyPath]}"
		}
		const [componentType, propertyPath] = parts
		const frame = context.getComponentData(componentType.substring(1))
		if (!frame) {
			throw (
				"Could not find component output data for component: " +
				componentType
			)
		}
		return get(
			frame.data,
			propertyPath.substring(0, propertyPath.length - 1)
		) as string
	},
	User: (expression, context) => {
		const user = context.getUser()
		if (!user) return ""
		if (expression === "initials") {
			return user.firstname
				? user.firstname.charAt(0) + user.lastname.charAt(0)
				: user.id.charAt(0)
		}
		if (expression === "picture") {
			if (!user.picture) return ""
			// Remove the workspace context here
			const useContext = context.getWorkspace() ? new Context() : context
			return getUserFileURL(
				useContext,
				user.picture.id,
				"" + user.picture.updatedat
			)
		}
		return user[expression as keyof Omit<UserState, "picture">] || ""
	},
	Time: (expression, context) => {
		const value = context.getRecord()?.getDateValue(expression)
		if (!value) return ""
		return `${value.toLocaleDateString()} ${value.toLocaleTimeString()}`
	},
	Date: (expression, context) => {
		const value = context.getRecord()?.getDateValue(expression)
		if (!value) return ""
		return value.toLocaleDateString(undefined, { timeZone: "UTC" })
	},
	RecordMeta: (expression, context) => {
		const record = context.getRecord()
		if (expression === "id") {
			return record?.getId() || ""
		}
		if (expression === "uniqueKey") {
			return record?.getUniqueKey() || ""
		}
		if (expression === "index") {
			return `${context.getRecordDataIndex() || 0}`
		}
		if (expression === "isNew") {
			return `${record?.isNew || ""}`
		}
		if (expression === "isDeleted") {
			return `${record?.isDeleted || ""}`
		}
		return ""
	},
	Theme: (expression, context) => {
		const [scope, value] = expression.split(".")
		const theme = context.getTheme()
		if (scope === "color") {
			return theme.definition.palette[value]
		}
		return ""
	},
	SelectList: (expression, context) => {
		const wire = context.getWire()
		const fieldMetadata = wire?.getCollection().getField(expression)
		const selectListMetadata = fieldMetadata?.getSelectOptions(context)
		const value = context.getRecord()?.getFieldValue(expression)
		const label =
			selectListMetadata?.find((el) => el.value === value)?.label || ""
		return context.getLabel(label) || ""
	},
	File: (expression, context) => getURLFromFullName(context, expression),
	UserFile: (expression, context) => {
		const file = context
			.getRecord()
			?.getFieldValue<PlainWireRecord>(expression)
		if (!file) return ""
		const fileId = file[ID_FIELD] as string
		if (!fileId) return ""
		const fileVersion = file[UPDATED_AT_FIELD] as string
		return getUserFileURL(context, fileId, fileVersion)
	},
	Site: (expression, context) => {
		const site = context.getSite()
		return site?.[expression as keyof SiteState] || ""
	},
	StaticFile: (expression) => getStaticAssetsPath() + "/static" + expression,
	Label: (expression, context) => {
		const label = context.getLabel(expression)
		if (!label) return expression
		return label || "missing label value"
	},
}

export { handlers }
export type { MergeType }

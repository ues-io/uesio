import Wire from "../bands/wire/class"
import { getURLFromFullName, getUserFileURL } from "../hooks/fileapi"
import { PlainWireRecord } from "../bands/wirerecord/types"
import WireRecord from "../bands/wirerecord/class"
import { ID_FIELD } from "../collectionexports"
import { Context } from "./context"

type MergeType =
	| "Record"
	| "Param"
	| "User"
	| "Time"
	| "Date"
	| "RecordId"
	| "Theme"
	| "File"
	| "UserFile"
	| "Site"
	| "Label"
	| "SelectList"
	| "Sum"

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
			const wire = context.getWireByName(wirename)
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
			wire = context.getWireByName(wirename)
			expression = expressionParts[1]
		}

		let total = 0
		wire?.getData().forEach((record) => {
			total += (record.getFieldValue(expression) as number) || 0
		})
		return "" + total
	},
	Param: (expression, context) => context.getParam(expression) || "",
	User: (expression, context) => {
		const user = context.getUser()
		if (!user) return ""
		if (expression === "initials") {
			return user.firstname
				? user.firstname.charAt(0) + user.lastname.charAt(0)
				: user.id.charAt(0)
		}
		if (expression === "picture") {
			// Remove the workspace context here
			return getUserFileURL(
				context.getWorkspace() ? new Context() : context,
				user.picture
			)
		}
		return user[expression as keyof typeof user] || ""
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
	RecordId: (expression, context) => context.getRecordId() || "",
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
		const selectListMetadata = fieldMetadata?.getSelectOptions()
		const value = context.getRecord()?.getFieldValue(expression)
		return selectListMetadata?.find((el) => el.value === value)?.label || ""
	},
	File: (expression, context) => getURLFromFullName(context, expression),
	UserFile: (expression, context) => {
		const file = context
			.getRecord()
			?.getFieldValue<PlainWireRecord>(expression)
		if (!file) return ""
		const fileId = file[ID_FIELD] as string
		if (!fileId) return ""
		return getUserFileURL(context, fileId)
	},
	Site: (expression, context) => {
		const site = context.getSite()
		if (!site) return ""
		if (expression === "domain") {
			return site.domain
		}
		return ""
	},
	Label: (expression, context) => {
		const label = context.getLabel(expression)
		if (!label) return expression
		return label || "missing label value"
	},
}

export { handlers, MergeType }

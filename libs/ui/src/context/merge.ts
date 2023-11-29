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
import { wire } from ".."

type MergeType =
	| "Error"
	| "Route"
	| "Record"
	| "Records"
	| "Param"
	| "Prop"
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

type MergeHandler = (expression: string, context: Context) => wire.FieldValue

export const InvalidSignalOutputMergeMsg =
	"Invalid SignalOutput merge - a stepId and propertyPath must be provided, e.g. $SignalOutput{stepId:propertyPath}"
export const InvalidComponentOutputMsg =
	"Invalid ComponentOutput merge - a componentType and property must be provided, e.g. $ComponentOutput{[componentType][propertyPath]}"

const handlers: Record<MergeType, MergeHandler> = {
	Record: (fullExpression, context) => {
		const expressionParts = fullExpression.split(":")
		let record: WireRecord | undefined
		let expression = fullExpression
		if (expressionParts.length === 1) {
			record = context.getRecord()
		} else {
			const wirename = expressionParts[0]
			record = context.getRecord(wirename)
			expression = expressionParts[1]
		}
		return record?.getFieldValue(expression) ?? ""
	},
	Records: (fullExpression, context) => {
		const expressionParts = fullExpression.split(":")
		let records: WireRecord[] | undefined
		let expression = fullExpression
		// TODO: Find closest multi-record context
		if (expressionParts.length === 1) {
			records = context.getWire()?.getData()
		} else {
			const wirename = expressionParts[0]
			records = context.getWire(wirename)?.getData()
			expression = expressionParts[1]
		}
		return (
			records?.map(
				(r) => r.getFieldValue<wire.PlainFieldValue>(expression) ?? ""
			) || ([] as wire.PlainFieldValue[])
		)
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
		return total
	},
	Param: (expression, context) => context.getParam(expression) ?? "",
	SignalOutput: (expression, context) => {
		// Expression MUST have 2+ parts, e.g. $SignalOutput{[stepId][propertyPath]}
		let parts
		try {
			parts = parseTwoPartExpression(expression)
		} catch (e) {
			throw InvalidSignalOutputMergeMsg
		}
		const [stepId, propertyPath] = parts
		const signalOutputFrame = context.getSignalOutputs(stepId)
		if (!signalOutputFrame) {
			throw `Could not find signal output for step: ${stepId}`
		}
		return get(signalOutputFrame.data, propertyPath)
	},
	ComponentOutput: (expression, context) => {
		// Expression MUST have 2+ parts, e.g. $ComponentOutput{[componentType][property]}
		let parts
		try {
			parts = parseTwoPartExpression(expression)
		} catch (e) {
			throw InvalidComponentOutputMsg
		}
		const [componentType, propertyPath] = parts
		const frame = context.getComponentData(componentType)
		if (!frame) {
			throw (
				"Could not find component output data for component: " +
				componentType
			)
		}
		return get(frame.data, propertyPath) as string
	},
	User: (expression, context) => {
		const user = context.getUser()
		if (!user) return ""
		if (expression === "initials") {
			return user.firstname
				? user.firstname.charAt(0) + user.lastname.charAt(0)
				: user.username.charAt(0)
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
		return user[expression as keyof Omit<UserState, "picture">] ?? ""
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
	Route: (expression, context) => {
		if (expression !== "path" && expression !== "title") return ""
		return context.getRoute()?.[expression] ?? ""
	},
	RecordMeta: (expression, context) => {
		const record = context.getRecord()
		if (expression === "id") {
			return record?.getId() || ""
		}
		if (expression === "uniqueKey") {
			return record?.getUniqueKey() ?? ""
		}
		if (expression === "index") {
			return context.getRecordDataIndex() || 0
		}
		if (expression === "isNew") {
			return record?.isNew() || false
		}
		if (expression === "isDeleted") {
			return record?.isDeleted() || false
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
		if (expression === "url") {
			return `https://${site?.subdomain ? site.subdomain + "." : ""}${
				site?.domain
			}`
		}
		if (expression === "dependencies") return ""
		return site?.[expression as keyof Omit<SiteState, "dependencies">] || ""
	},
	StaticFile: (expression) => getStaticAssetsPath() + "/static" + expression,
	Label: (expression, context) => {
		const label = context.getLabel(expression)
		if (!label) return expression
		return label || "missing label value"
	},
	Error: (_, context) => {
		const errors = context.getCurrentErrors()
		if (!errors?.length) return ""
		return errors[0]
	},
	Prop: (expression, context) =>
		// Technically the result doesn't have to be a string,
		// but until we improve merge typing to allow for non-string values,
		// we'll pretend the prop will always be a string
		(context.getProp(expression) as string) ?? "",
}

/**
 * Parses an expression which is expected to have 2 parts, delimited with one of the following syntaxes:
 *  a. [part1][part2]
 *  b. part1:part2
 *
 * We support both because:
 * (a) is more safe, allowing you to have ":" in one of the parts, but is more verbose
 * (b) is more concise, but more fragile.
 *
 * @returns [part1, part2]
 * @throws InvalidExpressionError
 */

const InvalidExpressionError = "Invalid Expression"
const bracketedDelimiter = "]["
const colonDelimiter = ":"

const parseTwoPartExpression = (expression: string) => {
	let parts
	let part1, part2
	if (expression.includes(bracketedDelimiter)) {
		parts = expression.split(bracketedDelimiter)
		if (parts.length !== 2) {
			throw InvalidExpressionError
		}
		;[part1, part2] = parts
		if (part1[0] !== "[" || part2[part2.length - 1] !== "]") {
			throw InvalidExpressionError
		}
		try {
			parts = [part1.substring(1), part2.substring(0, part2.length - 1)]
		} catch (e) {
			throw InvalidExpressionError
		}
	} else if (expression.includes(colonDelimiter)) {
		parts = expression.split(colonDelimiter)
	}
	if (!parts || parts.length !== 2) {
		throw InvalidExpressionError
	}
	return parts
}

export { handlers, parseTwoPartExpression }
export type { MergeType }

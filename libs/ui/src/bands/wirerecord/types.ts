type FieldValue =
	| string
	| number
	| boolean
	| undefined
	| null
	| PlainWireRecord
	| Map<string, boolean>

type PlainWireRecord = {
	[key: string]: FieldValue
}

export { PlainWireRecord, FieldValue }

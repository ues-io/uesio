type FieldValue = string | number | boolean | undefined | PlainWireRecord

type PlainWireRecord = {
	[key: string]: FieldValue
}

type PlainWireRecordMap = {
	[key: string]: PlainWireRecord
}

export { PlainWireRecordMap, PlainWireRecord }

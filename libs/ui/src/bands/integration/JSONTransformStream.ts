type JSONTransformStreamOptions = {
	// If true, then no error will be thrown for JSON which was not terminated
	// Defaults to true
	allowIncompleteJson?: boolean
}
// JSONTransformStream takes a stream of JSON strings and outputs JSON objects
function JSONTransformStream(options: JSONTransformStreamOptions = {}) {
	let buffer = ""
	const { allowIncompleteJson = true } = options
	return new TransformStream<string, object>({
		transform: (
			chunk: string,
			controller: TransformStreamDefaultController<object>
		) => {
			buffer += chunk
			let remaining = buffer
			while (remaining.includes("}")) {
				// First try to find an object delimiter with a comma after it
				const startIndex = remaining.indexOf("{")
				let endIndex = remaining.indexOf("},")
				if (endIndex === -1) {
					endIndex = remaining.indexOf("}")
				}
				// If we have both a start index and an end index, parse that out
				if (startIndex !== -1 && endIndex !== -1) {
					const objectString = remaining.substring(
						startIndex,
						endIndex + 1
					)
					try {
						const obj = JSON.parse(objectString)
						controller.enqueue(obj)
						remaining = remaining.substring(endIndex + 1)
					} catch (e) {
						// If we can't parse the data, break out, we can't parse what we've got
						break
					}
					continue
				}
			}
			// If we have any remaining text, set it as the buffer text
			// but strip off any closing brackets
			if (remaining) {
				if (remaining.trim() === "]") {
					remaining = ""
				}
			}
			buffer = remaining
		},
		flush: (controller: TransformStreamDefaultController<object>) => {
			// If there's any remaining data in the buffer, it's incomplete JSON
			if (buffer.length > 0 && !allowIncompleteJson) {
				controller.error(new Error("Incomplete JSON in the stream."))
			}
		},
	})
}

export default JSONTransformStream

export type { JSONTransformStreamOptions }

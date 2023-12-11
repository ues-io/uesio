package goutils

import (
	"strings"
	"unicode"
)

func SafeJoinStrings(elems []string, delimiter string) string {
	parts := make([]string, len(elems))
	for i, elem := range elems {
		parts[i] = strings.TrimSuffix(strings.TrimPrefix(elem, delimiter), delimiter)
	}
	return strings.Join(parts, delimiter)
}

func Capitalize(str string) string {
	runes := []rune(str)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

// StringValue returns the input interface{} as a string.
// if the value is not a string type, the empty string is returned.
func StringValue(v interface{}) string {
	if stringValue, isString := v.(string); isString {
		return stringValue
	}
	return ""
}

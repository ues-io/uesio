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
func StringValue(v any) string {
	if stringValue, isString := v.(string); isString {
		return stringValue
	}
	if stringSliceValue, isStringSlice := v.([]string); isStringSlice {
		if len(stringSliceValue) > 0 {
			return stringSliceValue[0]
		}
	}
	return ""
}

// StringSliceValue does a best effort to coerce the input interface{} to a []string.
// if the value is an []string{} it will be returned immediately.
// if the value is an []interface{}, it will cast the items to strings and create a []string.
// if the value is a string, a []string with that value will be returned.
// otherwise, (nil, false) is returned
func StringSliceValue(v any) ([]string, bool) {
	switch typed := v.(type) {
	case []string:
		return typed, true
	case []any:
		stringSlice := make([]string, len(typed))
		for i := range typed {
			stringSlice[i] = StringValue(typed[i])
		}
		return stringSlice, true
	case string:
		return []string{typed}, true
	}
	return nil, false
}

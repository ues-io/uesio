package param

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func GetRequiredString(params map[string]interface{}, paramName string) (string, error) {
	if paramValue, hasParam := params[paramName]; hasParam {
		if stringValue, isString := paramValue.(string); isString {
			return stringValue, nil
		}
	}
	return "", exceptions.NewInvalidParamException("missing required parameter "+paramName, paramName)
}

func GetOptionalString(params map[string]interface{}, paramName, defaultValue string) string {
	if paramValue, hasParam := params[paramName]; hasParam {
		if stringValue, isString := paramValue.(string); isString {
			if stringValue == "" {
				return defaultValue
			}
			return stringValue
		}
	}
	return defaultValue
}

func GetBoolean(params map[string]interface{}, paramName string) bool {
	paramValue, hasValue := params[paramName]
	if !hasValue {
		return false
	}
	boolValue, isBool := paramValue.(bool)
	if !isBool {
		return false
	}
	return boolValue
}

func GetAsInt(m map[string]interface{}, key string) (int, bool) {
	if value, ok := m[key]; ok {
		if intValue, isInt := value.(int); isInt {
			return intValue, true
		}
		if floatValue, isFloat := value.(float64); isFloat {
			return int(floatValue), true
		}
		if stringValue, isString := value.(string); isString {
			intValue, err := strconv.Atoi(stringValue)
			if err != nil {
				return 0, false
			}
			return intValue, true
		}
	}
	return 0, false
}

package merge

import (
	"errors"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"regexp"
)

type ServerMergeData struct {
	Session     *sess.Session
	WireData    map[string]*adapt.LoadOp
	ParamValues map[string]string
}

var RecordMergeRegex = regexp.MustCompile(`(?P<wireName>\[a-zA-Z0-9_\])(?P<fieldName>\[a-zA-Z0-9_\])`)

var ServerMergeFuncs = map[string]interface{}{
	"Param": func(m ServerMergeData, key string) (interface{}, error) {
		val, ok := m.ParamValues[key]
		if !ok {
			return nil, errors.New("missing param " + key)
		}
		return val, nil
	},
	"User": func(m ServerMergeData, key string) (interface{}, error) {

		userID := m.Session.GetUserID()

		if key == "id" {
			return userID, nil
		}

		return nil, nil
	},
	"Record": func(m ServerMergeData, key string) (interface{}, error) {

		// Parse the key to support the following Record data merge scenarios
		// $Record{[wireName][fieldName]}
		recordMergeParams := extractRegexParams(RecordMergeRegex, key)

		wireName, hasWireName := recordMergeParams["wireName"]
		if !hasWireName {
			return nil, errors.New("$Record{} merge missing [wireName]")
		}
		fieldName, hasFieldName := recordMergeParams["fieldName"]
		if !hasFieldName {
			return nil, errors.New("$Record{} merge missing [fieldName]")
		}

		wireData, hasWireData := m.WireData[wireName]
		if !hasWireData {
			return nil, errors.New("$Record{} merge referenced wire " + wireName + ", which was not loaded.")
		}

		wireDataBytes, err := wireData.GetBytes()
		if err != nil {
			return nil, errors.New("Unable to get data for wire: " + wireName)
		}

		wireData.

		return "foo", nil
	},
}

/**
 * Extracts parameters from a string using a Regex into a map[string]string
 *
 */
func extractRegexParams(compiledRegex *regexp.Regexp, template string) (paramsMap map[string]string) {

	match := compiledRegex.FindStringSubmatch(template)

	paramsMap = make(map[string]string)
	for i, name := range compiledRegex.SubexpNames() {
		if i > 0 && i <= len(match) {
			paramsMap[name] = match[i]
		}
	}
	return paramsMap
}

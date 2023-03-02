package merge

import (
	"errors"
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"regexp"
)

type ServerMergeData struct {
	Session     *sess.Session
	WireData    map[string]meta.Group
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

		if wireData.Len() < 1 {
			return nil, errors.New("$Record{} merge referenced wire " + wireName + " which did not return any records.")
		}

		var targetValue string

		err := wireData.Loop(func(item meta.Item, index string) error {
			fmt.Println("index is " + index)
			if index == "0" {
				fmt.Println("---INDEX 0")
				fieldValue, err := item.GetField(fieldName)
				if err != nil {
					return err
				}
				stringValue, isString := fieldValue.(string)
				if !isString {
					return errors.New("could not get Record merge value")
				}
				targetValue = stringValue
			}
			return nil
		})
		if err != nil {
			return nil, err
		}

		return targetValue, nil
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

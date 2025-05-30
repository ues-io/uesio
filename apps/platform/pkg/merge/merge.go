package merge

import (
	"errors"
	"fmt"
	"regexp"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
)

type ServerMergeData struct {
	Session     *sess.Session
	WireData    map[string]meta.Group
	ParamValues map[string]any
}

var AlphaUnderscore = "[a-zA-Z_]+"
var MetadataKey = fmt.Sprintf(`%s\/%s\.%s`, AlphaUnderscore, AlphaUnderscore, AlphaUnderscore)
var RecordMergeRegex = regexp.MustCompile(fmt.Sprintf(`(?P<wireName>%s)\:(?P<fieldName>%s|%s)`, AlphaUnderscore, MetadataKey, AlphaUnderscore))

var ParamMergeFunc = func(m ServerMergeData, key string) (any, error) {
	val, ok := m.ParamValues[key]
	if !ok {
		return "", nil
	}
	return val, nil
}

var UserMergeFunc = func(m ServerMergeData, key string) (any, error) {
	userInfo := m.Session.GetContextUser()
	if userInfo == nil {
		return nil, nil
	}
	switch key {
	case "id":
		return userInfo.ID, nil
	case "firstname":
		return userInfo.FirstName, nil
	case "lastname":
		return userInfo.LastName, nil
	case "email":
		return userInfo.Email, nil
	case "language":
		return userInfo.Language, nil
	case "username":
		return userInfo.Username, nil
	}
	return nil, nil
}

var SiteMergeFunc = func(m ServerMergeData, key string) (any, error) {
	siteInfo := m.Session.GetContextSite()
	if siteInfo == nil {
		return nil, nil
	}
	switch key {
	case "title":
		return siteInfo.Title, nil
	case "name":
		return siteInfo.Name, nil
	case "scheme":
		return siteInfo.Scheme, nil
	case "domain":
		return siteInfo.Domain, nil
	case "subdomain":
		return siteInfo.Subdomain, nil
	case "url":
		var subdomain string
		if siteInfo.Subdomain != "" {
			subdomain = siteInfo.Subdomain + "."
		}
		return tls.ServeAppDefaultScheme() + "://" + subdomain + siteInfo.Domain, nil
	}
	return nil, nil
}

var RecordMergeFunc = func(m ServerMergeData, key string) (any, error) {
	// Parse the key to support the following Record data merge scenarios
	// $Record{wireName:fieldName}
	recordMergeParams := extractRegexParams(RecordMergeRegex, key)

	wireName, hasWireName := recordMergeParams["wireName"]
	if !hasWireName {
		return nil, errors.New("$Record{} merge missing wireName")
	}
	fieldName, hasFieldName := recordMergeParams["fieldName"]
	if !hasFieldName {
		return nil, errors.New("$Record{} merge missing fieldName")
	}

	wireData, hasWireData := m.WireData[wireName]
	if !hasWireData {
		return nil, fmt.Errorf("$Record{} merge referenced wire %s, which was not loaded", wireName)
	}

	if wireData.Len() < 1 {
		return "", nil
	}

	targetValue := ""

	err := wireData.Loop(func(item meta.Item, index string) error {
		if index == "0" {
			fullyQualifiedKey := meta.GetFullyQualifiedKey(fieldName, m.Session.GetContextAppName())
			fieldValue, err := item.GetField(fullyQualifiedKey)
			if err != nil {
				return nil
			}
			stringValue, isString := fieldValue.(string)
			if !isString {
				return nil
			}
			targetValue = stringValue
		}
		return nil
	})
	if err != nil {
		return nil, nil
	}

	return targetValue, nil
}

var ServerMergeFuncs = map[string]any{
	"Param":  ParamMergeFunc,
	"User":   UserMergeFunc,
	"Site":   SiteMergeFunc,
	"Record": RecordMergeFunc,
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

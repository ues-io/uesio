package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getUserMerge(session *sess.Session) map[string]interface{} {
	userInfo := session.GetUserInfo()
	return map[string]interface{}{
		"user.ID":      userInfo.ID,
		"user.Profile": userInfo.Profile,
	}
}
func getUserTokenUserTypeValue(tokenDefinition *meta.UserResponseTokenDefinition, session *sess.Session) (string, error) {
	userMerges := getUserMerge(session)
	return mergeTokenValue(tokenDefinition.Token, userMerges)
}

func mergeTokenValue(tokenTemplate string, mergeData interface{}) (string, error) {
	valueTemplate, err := templating.NewTemplateWithValidKeysOnly(tokenTemplate)
	if err != nil {
		return "", err
	}
	return templating.Execute(valueTemplate, mergeData)
}
func getTokenLookupTypeValues(lookupCollection string, conditions []*meta.TokenCondition, tokenTemplate string, mergeData interface{}, session *sess.Session) ([]string, error) {
	fieldKeys := templating.ExtractKeys(tokenTemplate)
	fields := make([]adapt.LoadRequestField, len(fieldKeys))
	for i, fieldKey := range fieldKeys {
		fields[i] = adapt.LoadRequestField{
			ID: fieldKey,
		}
	}

	loadConditions := make([]adapt.LoadRequestCondition, len(conditions))
	for i, condition := range conditions {
		valueTemplate, err := templating.NewTemplateWithValidKeysOnly(condition.Value)
		if err != nil {
			return nil, err
		}
		value, err := templating.Execute(valueTemplate, mergeData)
		if err != nil {
			return nil, err
		}
		loadConditions[i] = adapt.LoadRequestCondition{
			Field:    condition.Field,
			Value:    value,
			Operator: "=",
		}
	}

	var loadOps = []adapt.LoadOp{{
		CollectionName: lookupCollection,
		WireName:       "foo",
		Collection:     &adapt.Collection{},
		Conditions:     loadConditions,
		Fields:         fields,
	}}
	_, err := loadWithRecordPermissions(loadOps, session, false)
	if err != nil {
		return nil, err
	}
	records := loadOps[0].Collection
	if records == nil {
		return []string{}, nil
	}
	tokens := make([]string, records.Len())
	template, err := templating.NewTemplateWithValidKeysOnly(tokenTemplate)
	if err != nil {
		return tokens, nil
	}
	i := 0
	err = records.Loop(func(record loadable.Item) error {
		tokenValue, err := templating.Execute(template, record)
		if err != nil {
			return err
		}
		tokens[i] = tokenValue
		i++
		return nil
	})

	return tokens, err
}
func addToken(match string, tokens []string, newToken string) []string {
	return append(tokens, match+":"+newToken)
}

func makeMap(elements []string) map[string]bool {
	elementMap := make(map[string]bool)
	for _, element := range elements {
		elementMap[element] = true
	}
	return elementMap
}

func DetermineAccessFromChallengeTokens(metadata *adapt.CollectionMetadata, userResponseTokens []string, record loadable.Item, session *sess.Session) (string, error) {
	access := "none"
	challengeTokenDefinitions := metadata.RecordChallengeTokens
	userResponseTokenMap := makeMap(userResponseTokens)
	for _, tokenDefinition := range challengeTokenDefinitions {
		if tokenDefinition.Type == "lookup" {
			tokenValues, err := getTokenLookupTypeValues(tokenDefinition.Collection, tokenDefinition.Conditions, tokenDefinition.Token, record, session)
			if err != nil {
				return access, err
			}
			for _, token := range tokenValues {
				ok := userResponseTokenMap[tokenDefinition.Match+":"+token]
				if ok {
					if tokenDefinition.Access == "read-write" {
						// Max permission, short circuit
						return "read-write", nil
					} else if tokenDefinition.Access == "read" && access == "none" {
						access = tokenDefinition.Access
					}
				}
			}
		} else if tokenDefinition.Type == "record" {
			token, err := mergeTokenValue(tokenDefinition.Token, record)
			if err != nil {
				return access, err
			}
			ok := userResponseTokenMap[tokenDefinition.Match+":"+token]
			if ok {
				if tokenDefinition.Access == "read-write" {
					// Max permission, short circuit
					return "read-write", nil
				} else if tokenDefinition.Access == "read" && access == "none" {
					access = tokenDefinition.Access
				}
			}
		}
	}
	return access, nil
}
func getFieldsNeededFromRecordToDetermineWriteAccess(metadata *adapt.CollectionMetadata) []string {
	if metadata.Access != "protected" {
		return []string{}
	}
	fieldKeys := map[string]bool{}
	for _, tokenDefinition := range metadata.RecordChallengeTokens {
		if tokenDefinition.Type == "Lookup" {
			// we need the keys in the conditions,
			// not the template (which refers to the joined collection fields)
			for _, condition := range tokenDefinition.Conditions {
				keys := templating.ExtractKeys(condition.Value)
				for _, key := range keys {
					fieldKeys[key] = true
				}
			}
		} else if tokenDefinition.Type == "Record" {
			keys := templating.ExtractKeys(tokenDefinition.Token)
			for _, key := range keys {
				fieldKeys[key] = true
			}
		}
	}
	keys := make([]string, 0, len(fieldKeys))
	for key := range fieldKeys {
		keys = append(keys, key)
	}
	return keys
}
func hasWriteAccess(metadata *adapt.CollectionMetadata, recordId interface{}, fieldsNeeded []string, userResponseTokens []string, session *sess.Session) bool {
	if metadata.Access != "protected" {
		return true
	}
	fields := make([]adapt.LoadRequestField, len(fieldsNeeded))
	for i, fieldKey := range fieldsNeeded {
		fields[i] = adapt.LoadRequestField{
			ID: fieldKey,
		}
	}
	loadOp := adapt.LoadOp{
		CollectionName: metadata.Name,
		WireName:       "foo",
		Collection:     &adapt.Collection{},
		Conditions: []adapt.LoadRequestCondition{
			{
				Field: metadata.IDField,
				Value: recordId,
			},
		},
		Fields: fields,
	}
	var loadOps = []adapt.LoadOp{loadOp}
	_, err := loadWithRecordPermissions(loadOps, session, false)
	if err != nil {
		return false
	}
	if loadOp.Collection == nil || loadOp.Collection.Len() != 1 {
		return false
	}
	access, err := DetermineAccessFromChallengeTokens(metadata, userResponseTokens, loadOp.Collection.GetItem(0), session)
	if err != nil || access != "read-write" {
		return false
	}
	return true
}

func GenerateResponseTokens(metadata *adapt.CollectionMetadata, session *sess.Session) ([]string, error) {

	tokenDefinitions := metadata.UserResponseTokens
	tokens := []string{}
	if tokenDefinitions == nil || metadata.Access != "protected" {
		return tokens, nil
	}
	for _, tokenDefinition := range tokenDefinitions {
		if tokenDefinition.Type == "lookup" {
			tokenValues, err := getTokenLookupTypeValues(tokenDefinition.Collection, tokenDefinition.Conditions, tokenDefinition.Token, getUserMerge(session), session)
			if err != nil {
				return tokens, err
			}
			for _, token := range tokenValues {
				tokens = addToken(tokenDefinition.Match, tokens, token)
			}
		} else if tokenDefinition.Type == "user" {
			token, err := getUserTokenUserTypeValue(tokenDefinition, session)
			if err != nil {
				return tokens, err
			}
			tokens = addToken(tokenDefinition.Match, tokens, token)
		}
	}
	return tokens, nil
}

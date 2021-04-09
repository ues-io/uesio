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
	valueTemplate, err := templating.NewTemplateWithValidKeysOnly(tokenDefinition.Token)
	if err != nil {
		return "", err
	}
	return templating.Execute(valueTemplate, userMerges)
}
func getUserTokenLookupTypeValues(tokenDefinition *meta.UserResponseTokenDefinition, session *sess.Session) ([]string, error) {
	conditions := tokenDefinition.Conditions
	loadConditions := []adapt.LoadRequestCondition{}
	tokens := []string{}
	lookupCollection := tokenDefinition.Collection
	userMerges := getUserMerge(session)
	fields := []adapt.LoadRequestField{}
	for _, fieldKey := range templating.ExtractKeys(tokenDefinition.Token) {
		fields = append(fields, adapt.LoadRequestField{
			ID: fieldKey,
		})
	}
	for _, condition := range conditions {
		valueTemplate, err := templating.NewTemplateWithValidKeysOnly(condition.Value)
		if err != nil {
			return tokens, err
		}
		value, err := templating.Execute(valueTemplate, userMerges)
		if err != nil {
			return tokens, err
		}
		loadConditions = append(loadConditions, adapt.LoadRequestCondition{
			Field:    condition.Field,
			Value:    value,
			Operator: "=",
		})
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
		return tokens, err
	}
	records := loadOps[0].Collection
	if records != nil {
		tokenTemplate, err := templating.NewTemplateWithValidKeysOnly(tokenDefinition.Token)
		if err != nil {
			return tokens, nil
		}
		err = records.Loop(func(record loadable.Item) error {
			tokenValue, err := templating.Execute(tokenTemplate, record)
			if err != nil {
				return err
			}
			tokens = append(tokens, tokenValue)
			return nil
		})
	}
	return tokens, err
}
func addToken(match string, tokens []string, newToken string) []string {
	return append(tokens, match+":"+newToken)
}
func GenerateResponseTokens(metadata *adapt.CollectionMetadata, session *sess.Session) ([]string, error) {
	//userInfo := session.GetUserInfo()
	tokenDefinitions := metadata.UserResponseTokens
	tokens := []string{}
	if tokenDefinitions == nil {
		return tokens, nil
	}
	for _, tokenDefinition := range tokenDefinitions {
		if tokenDefinition.Type == "lookup" {
			tokenValues, err := getUserTokenLookupTypeValues(tokenDefinition, session)
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

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
	loadConditions := []adapt.LoadRequestCondition{}
	tokens := []string{}
	fields := []adapt.LoadRequestField{}
	for _, fieldKey := range templating.ExtractKeys(tokenTemplate) {
		fields = append(fields, adapt.LoadRequestField{
			ID: fieldKey,
		})
	}
	for _, condition := range conditions {
		valueTemplate, err := templating.NewTemplateWithValidKeysOnly(condition.Value)
		if err != nil {
			return tokens, err
		}
		value, err := templating.Execute(valueTemplate, mergeData)
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
		tokenTemplate, err := templating.NewTemplateWithValidKeysOnly(tokenTemplate)
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

func GenerateResponseTokens(metadata *adapt.CollectionMetadata, session *sess.Session) ([]string, error) {
	tokenDefinitions := metadata.UserResponseTokens
	tokens := []string{}
	if tokenDefinitions == nil {
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

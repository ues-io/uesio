package datasource

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func GenerateRecordChallengeTokens(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	tokenStrings := []string{}
	if collectionMetadata.Access != "protected" {
		return nil
	}

	for _, challengeToken := range collectionMetadata.RecordChallengeTokens {
		if challengeToken.Type == "lookup" {
			fieldKeys := templating.ExtractKeys(challengeToken.Token)
			fields := []adapt.LoadRequestField{}
			for _, fieldKey := range fieldKeys {
				fields = append(fields, adapt.LoadRequestField{
					ID: fieldKey,
				})
			}
			loadConditions := []adapt.LoadRequestCondition{}
			conditionTemplates := []string{}
			for _, condition := range challengeToken.Conditions {
				fields = append(fields, adapt.LoadRequestField{
					ID: condition.Field,
				})
				conditionTemplates = append(conditionTemplates, condition.Value)
				// Get the condition values
				valueTemplate, err := templating.NewTemplateWithValidKeysOnly(condition.Value)
				if err != nil {
					return err
				}

				uniqueValues := map[string]bool{}
				for _, update := range *op.Updates {
					value, err := templating.Execute(valueTemplate, update.FieldChanges)
					if err != nil {
						return err
					}
					uniqueValues[value] = true
				}
				for _, insert := range *op.Inserts {
					value, err := templating.Execute(valueTemplate, insert.FieldChanges)
					if err != nil {
						return err
					}
					uniqueValues[value] = true
				}

				var conditionValue interface{}
				var operator string

				if len(uniqueValues) == 1 {
					for key := range uniqueValues {
						conditionValue = key
						operator = "="
						break
					}
				} else {
					values := []string{}
					for key := range uniqueValues {
						values = append(values, key)
					}
					conditionValue = values
					operator = "IN"
				}

				loadConditions = append(loadConditions, adapt.LoadRequestCondition{
					Field:    condition.Field,
					Value:    conditionValue,
					Operator: operator,
				})
			}
			lookupResults := &adapt.Collection{}
			var loadOps = []adapt.LoadOp{{
				CollectionName: challengeToken.Collection,
				WireName:       "foo",
				Collection:     lookupResults,
				Conditions:     loadConditions,
				Fields:         fields,
			}}
			_, err := LoadWithOptions(loadOps, session, false)
			if err != nil {
				return err
			}

			// Make a lookup map based on the condition values

			conditionTemplate, err := templating.NewTemplateWithValidKeysOnly(strings.Join(conditionTemplates, "_"))
			if err != nil {
				return err
			}

			lookupCache := map[string][]loadable.Item{}

			err = lookupResults.Loop(func(record loadable.Item, _ interface{}) error {
				combinedKey, err := templating.Execute(conditionTemplate, record)
				if err != nil {
					return err
				}
				_, ok := lookupCache[combinedKey]
				if !ok {
					lookupCache[combinedKey] = []loadable.Item{}
				}
				lookupCache[combinedKey] = append(lookupCache[combinedKey], record)
				return nil
			})
			if err != nil {
				return err
			}

			tokenTemplate, err := templating.NewTemplateWithValidKeysOnly(challengeToken.Token)
			if err != nil {
				return err
			}
			// Loop over each insert and update and fill in token values
			for _, update := range *op.Updates {
				lookupKey, err := templating.Execute(conditionTemplate, update.FieldChanges)
				if err != nil {
					return err
				}
				tokensToAdd, ok := lookupCache[lookupKey]
				if !ok {
					continue
				}
				for _, item := range tokensToAdd {
					tokenString, err := templating.Execute(tokenTemplate, item)
					if err != nil {
						return err
					}
					fullTokenString := challengeToken.UserAccessToken + ":" + tokenString
					fmt.Println("Adding Token for Update: " + fullTokenString)
				}
			}

			for _, insert := range *op.Inserts {
				lookupKey, err := templating.Execute(conditionTemplate, insert.FieldChanges)
				if err != nil {
					return err
				}
				tokensToAdd, ok := lookupCache[lookupKey]
				if !ok {
					continue
				}

				writeTokens := map[string]bool{}

				for _, item := range tokensToAdd {
					tokenString, err := templating.Execute(tokenTemplate, item)
					if err != nil {
						return err
					}
					fullTokenString := challengeToken.UserAccessToken + ":" + tokenString
					fmt.Println("Adding Token for Insert: " + fullTokenString)
					if challengeToken.Access == "readwrite" {
						writeTokens[fullTokenString] = true
					}
				}

				// Now check to see if our user has at least one of the tokens needed to write.

			}

		}
	}

	fmt.Println("CHALLENGE TOKENS!")
	fmt.Println(tokenStrings)

	return nil
}

func GenerateUserAccessTokens(metadata *adapt.MetadataCache, session *sess.Session) ([]string, error) {

	tokenStrings := []string{}

	userAccessTokenNames := map[string]bool{}
	for _, collectionMetadata := range metadata.Collections {
		if collectionMetadata.Access != "protected" {
			continue
		}
		for _, challengeToken := range collectionMetadata.RecordChallengeTokens {
			if challengeToken.UserAccessToken != "" {
				userAccessTokenNames[challengeToken.UserAccessToken] = true
			}
		}
	}

	for key := range userAccessTokenNames {
		uat, err := meta.NewUserAccessToken(key)
		if err != nil {
			return nil, err
		}
		err = bundle.Load(uat, session)
		if err != nil {
			return nil, err
		}
		if uat.Type == "lookup" {
			fieldKeys := templating.ExtractKeys(uat.Token)
			fields := []adapt.LoadRequestField{}
			for _, fieldKey := range fieldKeys {
				fields = append(fields, adapt.LoadRequestField{
					ID: fieldKey,
				})
			}

			loadConditions := []adapt.LoadRequestCondition{}
			for _, condition := range uat.Conditions {
				loadConditions = append(loadConditions, adapt.LoadRequestCondition{
					Field:    condition.Field,
					Value:    session.GetUserInfo().ID,
					Operator: "=",
				})
			}
			lookupResults := &adapt.Collection{}
			var loadOps = []adapt.LoadOp{{
				CollectionName: uat.Collection,
				WireName:       "foo",
				Collection:     lookupResults,
				Conditions:     loadConditions,
				Fields:         fields,
			}}
			_, err := LoadWithOptions(loadOps, session, false)
			if err != nil {
				return nil, err
			}

			template, err := templating.NewTemplateWithValidKeysOnly(uat.Token)
			if err != nil {
				return nil, err
			}
			err = lookupResults.Loop(func(record loadable.Item, _ interface{}) error {
				tokenValue, err := templating.Execute(template, record)
				if err != nil {
					return err
				}
				tokenStrings = append(tokenStrings, uat.GetKey()+":"+tokenValue)
				return nil
			})
			if err != nil {
				return nil, err
			}
		}
	}

	return tokenStrings, nil
}

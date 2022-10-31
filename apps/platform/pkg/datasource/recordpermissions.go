package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type tokenFunc func(meta.Item) (string, bool, error)

func getAccessFields(collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache) ([]adapt.LoadRequestField, error) {
	if collectionMetadata.AccessField == "" {
		return nil, nil
	}

	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return nil, err
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
	if err != nil {
		return nil, err
	}

	fields := []adapt.LoadRequestField{}

	for fieldID, fieldInfo := range refCollectionMetadata.Fields {
		// TODO: We should be better about deciding which field we load in here
		if fieldInfo.Type == "REFERENCEGROUP" {
			continue
		}
		var subFields []adapt.LoadRequestField
		if fieldID == refCollectionMetadata.AccessField {
			subFields, err = getAccessFields(refCollectionMetadata, metadata)
			if err != nil {
				return nil, err
			}
		}

		fields = append(fields, adapt.LoadRequestField{
			ID:     fieldID,
			Fields: subFields,
		})
	}

	return fields, nil

}

func loadInAccessFieldData(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	referencedCollections := adapt.ReferenceRegistry{}

	metadata := connection.GetMetadata()

	fieldMetadata, err := op.Metadata.GetField(op.Metadata.AccessField)
	if err != nil {
		return err
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
	if err != nil {
		return err
	}

	fields, err := getAccessFields(op.Metadata, metadata)
	if err != nil {
		return err
	}

	refReq := referencedCollections.Get(fieldMetadata.ReferenceMetadata.Collection)
	refReq.Metadata = refCollectionMetadata

	refReq.AddFields(fields)

	err = op.LoopChanges(func(change *adapt.ChangeItem) error {
		fk, err := change.GetField(op.Metadata.AccessField)
		if err != nil {
			return err
		}
		fkField, err := adapt.GetReferenceKey(fk)
		if err != nil {
			return err
		}
		return refReq.AddID(fkField, adapt.ReferenceLocator{
			Item:  change,
			Field: fieldMetadata,
		})
	})
	if err != nil {
		return err
	}

	return adapt.HandleReferences(connection, referencedCollections, session, false)
}

func handleStandardChange(change *adapt.ChangeItem, tokenFuncs []tokenFunc, session *sess.Session) error {
	ownerID, err := change.GetOwnerID()
	if err != nil {
		return err
	}
	ownerToken := "uesio.owner:" + ownerID
	change.AddReadWriteToken(ownerToken)

	hasToken := false

	userCanModifyAllRecords := session.GetContextPermissions().ModifyAllRecords

	for _, userToken := range session.GetTokens() {
		if ownerToken == userToken {
			hasToken = true
		}
	}

	for _, tokenFunc := range tokenFuncs {
		token, isReadWrite, err := tokenFunc(change)
		if err != nil {
			return err
		}

		// The token could be blank if the token did not meet the
		// conditions applied to that token.
		if token == "" {
			continue
		}

		if isReadWrite {
			for _, userToken := range session.GetTokens() {
				if token == userToken {
					hasToken = true
				}
			}
			change.AddReadWriteToken(token)
		} else {
			change.AddReadToken(token)
		}
	}

	if !hasToken && !userCanModifyAllRecords {
		return errors.New("User does not have access to write to this field: " + change.UniqueKey)
	}

	return nil

}

func handleAccessFieldChange(change *adapt.ChangeItem, tokenFuncs []tokenFunc, metadata *adapt.MetadataCache, session *sess.Session) error {

	var accessItem meta.Item

	accessItem = change.FieldChanges

	challengeMetadata := change.Metadata

	userCanModifyAllRecords := session.GetContextPermissions().ModifyAllRecords

	for challengeMetadata.AccessField != "" {
		accessInterface, err := accessItem.GetField(challengeMetadata.AccessField)
		if err != nil {
			return err
		}

		accessItem, err = adapt.GetLoadable(accessInterface)
		if err != nil {
			return fmt.Errorf("Couldn't convert item: %T", accessInterface)
		}

		fieldMetadata, err := challengeMetadata.GetField(challengeMetadata.AccessField)
		if err != nil {
			return err
		}
		challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
		if err != nil {
			return err
		}
	}

	ownerObj, err := accessItem.GetField("uesio/core.owner")
	if err != nil {
		return err
	}

	ownerID, err := adapt.GetReferenceKey(ownerObj)
	if err != nil {
		return err
	}

	ownerToken := "uesio.owner:" + ownerID

	hasToken := false

	for _, userToken := range session.GetTokens() {
		if ownerToken == userToken {
			hasToken = true
			//fmt.Println("GRANTED BASED ON OWNER OF: " + challengeMetadata.GetFullName())
		}
	}

	for _, tokenFunc := range tokenFuncs {
		token, isReadWrite, err := tokenFunc(accessItem)
		if err != nil {
			return err
		}

		// We don't care about read tokens here because we're doing a write
		if isReadWrite {
			for _, userToken := range session.GetTokens() {
				if token == userToken {
					//fmt.Println("GRANTED BASED ON TOKEN: " + challengeMetadata.GetFullName() + " MATCHING " + token)
					hasToken = true
					break
				}
			}
		}
	}

	if !hasToken && !userCanModifyAllRecords {
		return errors.New("User does not have parent access to write to this field: " + change.IDValue)
	}

	return nil
}

func GenerateRecordChallengeTokens(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	if !op.Metadata.IsWriteProtected() {
		return nil
	}

	// If we have an access field, we need to load in all data from that field
	if op.Metadata.AccessField != "" {
		err := loadInAccessFieldData(op, connection, session)
		if err != nil {
			return err
		}
	}

	metadata := connection.GetMetadata()

	challengeMetadata, err := adapt.GetChallengeCollection(metadata, op.Metadata)
	if err != nil {
		return err
	}

	tokenFuncs := []tokenFunc{}

	for index := range challengeMetadata.RecordChallengeTokens {
		challengeToken := challengeMetadata.RecordChallengeTokens[index]
		tokenTemplate, err := adapt.NewFieldChanges(challengeToken.Token, challengeMetadata)
		if err != nil {
			return err
		}
		tokenFuncs = append(tokenFuncs, func(item meta.Item) (string, bool, error) {

			// First check to make sure that the token meets the supplied conditions
			if challengeToken.Conditions != nil {
				for _, condition := range challengeToken.Conditions {
					fieldValue, err := item.GetField(condition.Field)
					if err != nil {
						return "", false, err
					}
					if fieldValue != condition.Value {
						// The Token did not meet a required condition
						return "", false, nil
					}
				}
			}

			tokenValue, err := templating.Execute(tokenTemplate, item)
			if err != nil {
				return "", false, err
			}
			return challengeToken.UserAccessToken + ":" + tokenValue, challengeToken.Access == "readwrite", nil
		})
	}

	return op.LoopChanges(func(change *adapt.ChangeItem) error {
		if op.Metadata.AccessField != "" {
			return handleAccessFieldChange(change, tokenFuncs, metadata, session)
		}
		return handleStandardChange(change, tokenFuncs, session)
	})

}

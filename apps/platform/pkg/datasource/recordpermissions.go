package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type tokenFunc func(meta.Item) (string, bool, error)

func getChallengeCollection(metadata *wire.MetadataCache, collectionMetadata *wire.CollectionMetadata) (*wire.CollectionMetadata, error) {
	if collectionMetadata.AccessField == "" {
		return collectionMetadata, nil
	}
	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return nil, err
	}
	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
	if err != nil {
		return nil, err
	}

	return getChallengeCollection(metadata, refCollectionMetadata)
}

func getAccessFields(collectionMetadata *wire.CollectionMetadata, metadata *wire.MetadataCache) ([]wire.LoadRequestField, error) {
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

	if refCollectionMetadata.AccessField == "" {
		fieldsMap := &FieldsMap{}
		for _, token := range refCollectionMetadata.RecordChallengeTokens {
			fieldsMap.merge(getFieldsMap(templating.ExtractKeys(token.Token)))
			for _, condition := range token.Conditions {
				fieldsMap.merge(getFieldsMap([]string{condition.Field}))
			}
		}
		fieldsMap.merge(getFieldsMap([]string{"uesio/core.owner"}))

		return fieldsMap.getRequestFields(), nil
	}

	subFields, err := getAccessFields(refCollectionMetadata, metadata)
	if err != nil {
		return nil, err
	}

	return []wire.LoadRequestField{
		{
			ID:     refCollectionMetadata.AccessField,
			Fields: subFields,
		},
	}, nil

}

func loadInAccessFieldData(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	referencedCollections := wire.ReferenceRegistry{}

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

	if err = op.LoopChanges(func(change *wire.ChangeItem) error {
		fk, err := change.GetReferenceKey(op.Metadata.AccessField)
		if err != nil {
			return err
		}
		return refReq.AddID(fk, wire.ReferenceLocator{
			Item:  change.FieldChanges,
			Field: fieldMetadata,
		})
	}); err != nil {
		return err
	}

	return HandleReferences(connection, referencedCollections, session, &ReferenceOptions{
		MergeItems: true,
	})
}

func handleStandardChange(change *wire.ChangeItem, tokenFuncs []tokenFunc, session *sess.Session) error {
	ownerID, err := change.GetOwnerID()
	if err != nil {
		return err
	}
	ownerToken := "uesio.owner:" + ownerID
	change.AddReadWriteToken(ownerToken)

	hasToken := false

	userCanModifyAllRecords := session.GetContextPermissions().ModifyAllRecords

	flatTokens := session.GetFlatTokens()

	for _, userToken := range flatTokens {
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
			for _, userToken := range flatTokens {
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
		return exceptions.NewForbiddenException("User does not have access to write to this record: " + change.UniqueKey + " of collection: " + change.Metadata.GetFullName())
	}

	return nil

}

func handleAccessFieldChange(change *wire.ChangeItem, tokenFuncs []tokenFunc, metadata *wire.MetadataCache, session *sess.Session) error {

	// Shortcut - if user can modify all records, no need to do any other checks
	if session.GetContextPermissions().ModifyAllRecords {
		return nil
	}

	var accessItem meta.Item

	accessItem = change.FieldChanges

	challengeMetadata := change.Metadata

	for challengeMetadata.AccessField != "" {
		accessInterface, err := accessItem.GetField(challengeMetadata.AccessField)
		if err != nil {
			return err
		}

		accessItem, err = wire.GetLoadable(accessInterface)
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

	ownerObj, err := accessItem.GetField(wire.OWNER_FIELD)
	if err != nil {
		return err
	}

	ownerID, err := wire.GetReferenceKey(ownerObj)
	if err != nil {
		return err
	}

	ownerToken := "uesio.owner:" + ownerID

	hasToken := false

	flatTokens := session.GetFlatTokens()

	for _, userToken := range flatTokens {
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
			for _, userToken := range flatTokens {
				if token == userToken {
					//fmt.Println("GRANTED BASED ON TOKEN: " + challengeMetadata.GetFullName() + " MATCHING " + token)
					hasToken = true
					break
				}
			}
		}
	}

	if !hasToken {
		return exceptions.NewForbiddenException("User does not have parent access to write to this record: " + change.UniqueKey + " of collection: " + change.Metadata.GetFullName())
	}

	return nil
}

func GenerateRecordChallengeTokens(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

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

	challengeMetadata, err := getChallengeCollection(metadata, op.Metadata)
	if err != nil {
		return err
	}

	var tokenFuncs []tokenFunc

	for index := range challengeMetadata.RecordChallengeTokens {
		challengeToken := challengeMetadata.RecordChallengeTokens[index]
		tokenTemplate, err := wire.NewFieldChanges(challengeToken.Token, challengeMetadata, metadata)
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

	return op.LoopChanges(func(change *wire.ChangeItem) error {
		if op.Metadata.AccessField != "" {
			return handleAccessFieldChange(change, tokenFuncs, metadata, session)
		}
		return handleStandardChange(change, tokenFuncs, session)
	})

}

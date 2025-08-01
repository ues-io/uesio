package datasource

import (
	"context"
	"fmt"

	"slices"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
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
	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection())
	if err != nil {
		return nil, err
	}
	return getChallengeCollection(metadata, refCollectionMetadata)
}

func getFieldsForTokens(tokens []*meta.RecordChallengeToken) *FieldsMap {
	fieldsMap := &FieldsMap{}
	for _, token := range tokens {
		fieldsMap.addMany(templating.ExtractKeys(token.Token))
		for _, condition := range token.Conditions {
			fieldsMap.add(condition.Field)
		}
	}
	fieldsMap.add(commonfields.Owner)
	return fieldsMap
}

func getAccessFields(collectionMetadata *wire.CollectionMetadata, metadata *wire.MetadataCache) (*FieldsMap, error) {
	if collectionMetadata.AccessField == "" {
		return getFieldsForTokens(collectionMetadata.RecordChallengeTokens), nil
	}

	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return nil, err
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection())
	if err != nil {
		return nil, err
	}

	subFields, err := getAccessFields(refCollectionMetadata, metadata)
	if err != nil {
		return nil, err
	}

	return &FieldsMap{
		collectionMetadata.AccessField: *subFields,
	}, nil

}

func loadInAccessFieldData(ctx context.Context, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	referencedCollections := wire.ReferenceRegistry{}

	metadata, err := op.GetMetadata()
	if err != nil {
		return err
	}

	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return err
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection())
	if err != nil {
		return err
	}

	fields, err := getAccessFields(refCollectionMetadata, metadata)
	if err != nil {
		return err
	}

	refReq := referencedCollections.Get(fieldMetadata.ReferenceMetadata.GetCollection())
	refReq.Metadata = refCollectionMetadata

	refReq.AddFields(fields.getRequestFields())

	if err = op.LoopAllChanges(func(change *wire.ChangeItem) error {
		fk, err := change.GetReferenceKey(collectionMetadata.AccessField)
		if err != nil {
			return err
		}
		if fk == "" {
			return nil
		}
		return refReq.AddID(fk, wire.ReferenceLocator{
			Item:  change.FieldChanges,
			Field: fieldMetadata,
		})
	}); err != nil {
		return err
	}

	return HandleReferences(ctx, connection, referencedCollections, metadata, session, &ReferenceOptions{
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

	userCanModifyAllRecords := session.GetContextPermissions().HasModifyAllRecordsPermission(change.Metadata.GetFullName())

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
		return exceptions.NewForbiddenException("user does not have access to write to this record: " + change.UniqueKey + " of collection: " + change.Metadata.GetFullName())
	}

	return nil

}

func handleAccessFieldChange(change *wire.ChangeItem, tokenFuncs []tokenFunc, metadata *wire.MetadataCache, session *sess.Session) error {

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
			return fmt.Errorf("couldn't convert item: %T", accessInterface)
		}

		fieldMetadata, err := challengeMetadata.GetField(challengeMetadata.AccessField)
		if err != nil {
			return err
		}
		challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection())
		if err != nil {
			return err
		}
	}

	ownerObj, err := accessItem.GetField(commonfields.Owner)
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
			if slices.Contains(flatTokens, token) {
				//fmt.Println("GRANTED BASED ON TOKEN: " + challengeMetadata.GetFullName() + " MATCHING " + token)
				hasToken = true
			}
		}
	}

	if !hasToken {
		return exceptions.NewForbiddenException("user does not have parent access to write to this record: " + change.UniqueKey + " of collection: " + change.Metadata.GetFullName())
	}

	return nil
}

func GenerateRecordChallengeTokens(ctx context.Context, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	if !collectionMetadata.IsWriteProtected() {
		return nil
	}

	metadata, err := op.GetMetadata()
	if err != nil {
		return err
	}

	challengeMetadata, err := getChallengeCollection(metadata, collectionMetadata)
	if err != nil {
		return err
	}

	// If we have an access field, we need to load in all data from that field
	if collectionMetadata.AccessField != "" {

		// Shortcut - if user can modify all records, no need to do any other checks
		if session.GetContextPermissions().HasModifyAllRecordsPermission(challengeMetadata.GetFullName()) {
			return nil
		}

		err := loadInAccessFieldData(ctx, op, connection, session)
		if err != nil {
			return err
		}
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

	return op.LoopAllChanges(func(change *wire.ChangeItem) error {
		if collectionMetadata.AccessField != "" {
			return handleAccessFieldChange(change, tokenFuncs, metadata, session)
		}
		return handleStandardChange(change, tokenFuncs, session)
	})

}

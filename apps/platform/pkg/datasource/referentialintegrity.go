package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func populateReference(field *adapt.FieldMetadata, metadataResponse *adapt.MetadataCache, adapter adapt.Adapter, credentials *adapt.Credentials, session *sess.Session) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {

		fieldFullName := field.GetFullName()
		fieldRawValue, err := change.FieldChanges.GetField(fieldFullName)

		//The field is not in the change so skip it
		if err != nil {
			return nil
		}

		referenceMetadata := field.ReferenceMetadata
		if referenceMetadata == nil {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Missing reference metadata")
		}

		fieldValue := fieldRawValue.(map[string]interface{})
		value := fieldValue["uesio.id"]

		results := &adapt.Collection{}
		fields := []adapt.LoadRequestField{{ID: "uesio.id"}}
		loadConditions := []adapt.LoadRequestCondition{{Field: "uesio.id", Value: value}}

		ops := []*adapt.LoadOp{{
			CollectionName: referenceMetadata.Collection,
			WireName:       "referentialIntegrity",
			Collection:     results,
			Conditions:     loadConditions,
			Fields:         fields,
			Query:          true,
		}}

		err = adapter.Load(ops, metadataResponse, credentials, session.GetTokens())

		if err != nil {
			return NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
		}

		if len(*results) != 1 {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Referential Integrity Violated")
		}

		return nil
	}
}

func getPopulationFunctionRI(collectionMetadata *adapt.CollectionMetadata, metadataResponse *adapt.MetadataCache, adapter adapt.Adapter, credentials *adapt.Credentials, session *sess.Session) validationFunc {

	populations := []validationFunc{}
	for _, field := range collectionMetadata.Fields {
		if field.Type == "REFERENCE" {
			populations = append(populations, populateReference(field, metadataResponse, adapter, credentials, session))
		}
	}

	return func(change adapt.ChangeItem, isNew bool) error {
		for _, population := range populations {
			err := population(change, isNew)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

func CheckReferentialIntegrity(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, metadataResponse *adapt.MetadataCache, adapter adapt.Adapter, credentials *adapt.Credentials, session *sess.Session) error {

	fieldPopulations := getPopulationFunctionRI(collectionMetadata, metadataResponse, adapter, credentials, session)

	if op.Inserts != nil {
		for i := range *op.Inserts {
			err := fieldPopulations((*op.Inserts)[i], true)
			if err != nil {
				return err
			}
		}
	}

	if op.Updates != nil {
		for i := range *op.Updates {
			err := fieldPopulations((*op.Updates)[i], false)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

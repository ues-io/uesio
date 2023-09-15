package datasource

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/translate"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type SpecialReferences struct {
	ReferenceMetadata *adapt.ReferenceMetadata
	Fields            []string
}

var specialRefs = map[string]SpecialReferences{
	"FILE": {
		ReferenceMetadata: &adapt.ReferenceMetadata{
			Collection: "uesio/core.userfile",
		},
		Fields: []string{"uesio/core.mimetype", "uesio/core.path", "uesio/core.updatedat"},
	},
	"USER": {
		ReferenceMetadata: &adapt.ReferenceMetadata{
			Collection: "uesio/core.user",
		},
		Fields: []string{"uesio/core.firstname", "uesio/core.lastname", "uesio/core.language", "uesio/core.picture"},
	},
}

type LoadOptions struct {
	Connection adapt.Connection
	Metadata   *adapt.MetadataCache
}

func getSubFields(loadFields []adapt.LoadRequestField) *FieldsMap {
	subFields := FieldsMap{}
	for _, subField := range loadFields {
		subFields[subField.ID] = *getSubFields(subField.Fields)
	}
	return &subFields
}

func processConditions(
	collectionKey string,
	conditions []adapt.LoadRequestCondition,
	params map[string]string,
	metadata *adapt.MetadataCache,
	ops []*adapt.LoadOp,
	session *sess.Session,
) error {

	var err error

	for i, condition := range conditions {

		// Convert reference-crossing conditions to subquery conditions
		if isReferenceCrossingField(condition.Field) {
			conditionPointer := &condition
			err = transformReferenceCrossingConditionToSubquery(collectionKey, conditionPointer, metadata)
			if err != nil {
				return err
			}
			// Mutate the original condition in the array, otherwise the changes will be lost
			conditions[i] = *conditionPointer
		}

		if condition.Type == "SUBQUERY" || condition.Type == "GROUP" {
			nestedCollection := collectionKey
			if condition.Type == "SUBQUERY" {
				nestedCollection = condition.SubCollection
			}
			if condition.SubConditions != nil {
				err := processConditions(nestedCollection, condition.SubConditions, params, metadata, ops, session)
				if err != nil {
					return err
				}
			}
			continue
		}

		if condition.ValueSource == "" || condition.ValueSource == "VALUE" {

			if condition.RawValues != nil {
				conditions[i].Values = condition.RawValues
			}

			stringValue, ok := condition.RawValue.(string)
			if !ok {
				if condition.RawValue != nil {
					conditions[i].Value = condition.RawValue
				}
				continue
			}

			template, err := templating.NewWithFuncs(stringValue, templating.ForceErrorFunc, merge.ServerMergeFuncs)
			if err != nil {
				return err
			}

			mergedValue, err := templating.Execute(template, merge.ServerMergeData{
				Session:     session,
				ParamValues: params,
			})
			if err != nil {
				return err
			}

			conditions[i].Value = mergedValue

		}

		if condition.ValueSource == "PARAM" && condition.Param != "" {
			value, ok := params[condition.Param]
			if !ok {
				return errors.New("Invalid Condition: " + condition.Param)
			}
			conditions[i].Value = value
		}

		if condition.ValueSource == "PARAM" && len(condition.Params) > 0 {
			var values []string
			for _, param := range condition.Params {
				value, ok := params[param]
				if !ok {
					return errors.New("Invalid Condition, parameter not provided: " + param)
				}
				values = append(values, value)
			}
			conditions[i].Values = values
		}

		if condition.ValueSource == "LOOKUP" && condition.LookupWire != "" && condition.LookupField != "" {

			// If we weren't provided ops to lookup, just don't process Lookups
			if ops == nil {
				continue
			}
			// Look through the previous wires to find the one to look up on.
			var lookupOp *adapt.LoadOp
			for _, lop := range ops {
				if lop.WireName == condition.LookupWire {
					lookupOp = lop
					break
				}
			}

			if lookupOp == nil {
				return errors.New("Could not find lookup wire: " + condition.LookupWire)
			}

			values := make([]interface{}, 0, lookupOp.Collection.Len())
			err := lookupOp.Collection.Loop(func(item meta.Item, index string) error {
				value, err := item.GetField(condition.LookupField)
				if err != nil {
					return err
				}
				values = append(values, value)
				return nil
			})
			if err != nil {
				return err
			}

			conditions[i].Values = values
			//default "IN"
			if conditions[i].Operator == "" {
				conditions[i].Operator = "IN"
			}
			if !(conditions[i].Operator == "IN" || conditions[i].Operator == "NOT_IN") {
				return errors.New("Invalid operator for lookup: " + conditions[i].Operator)
			}
		}
	}

	return nil
}

// example:
// uesio/tests.user->uesio/core.username = 'abel'
func transformReferenceCrossingConditionToSubquery(collectionName string, condition *adapt.LoadRequestCondition, metadata *adapt.MetadataCache) error {
	// Split the field name, and recursively process each part as an IN subquery condition
	// until we get to the final field, which we'll then handle as a normal condition
	parts := strings.Split(condition.Field, constant.RefSep)
	totalParts := len(parts)

	originalOperator := condition.Operator
	originalType := condition.Type
	// Move over RawValue/RawValues AND Value/Values because those store the original properties
	// received from the original request. Value/Values will be populated as part of processing the condition,
	// but in code (e.g. Bot code) it's very likely someone will populate condition.Value/Values instead,
	// so to prevent that mistake, move them all over.
	originalValue := condition.Value
	originalValues := condition.Values
	originalRawValue := condition.RawValue
	originalRawValues := condition.RawValues

	var previousCondition *adapt.LoadRequestCondition
	currentCondition := condition

	currentCollectionMetadata, err := metadata.GetCollection(collectionName)
	if err != nil {
		return errors.New("unable to find metadata for collection " + collectionName)
	}

	for i, fieldPart := range parts {
		if previousCondition != nil {
			currentCondition = &previousCondition.SubConditions[0]
		}
		if i == totalParts-1 {
			// We are on the last field, so we need to mutate the previous condition's SubConditions array
			currentCondition.Field = fieldPart
			currentCondition.Type = originalType
			currentCondition.Operator = originalOperator
			currentCondition.RawValue = originalRawValue
			currentCondition.RawValues = originalRawValues
			currentCondition.Value = originalValue
			currentCondition.Values = originalValues
		} else {
			// Convert the current condition to a subquery condition,
			// with a nested condition, and lookup the related collection metadata
			referenceField, err := currentCollectionMetadata.GetField(fieldPart)
			if err != nil {
				return errors.New("unable to find field " + fieldPart + " in collection " + currentCollectionMetadata.GetFullName())
			}
			if !adapt.IsReference(referenceField.Type) || referenceField.ReferenceMetadata == nil {
				return errors.New("field " + fieldPart + " in collection " + currentCollectionMetadata.GetFullName() + " is not a valid Reference field")
			}
			relatedCollectionName := referenceField.ReferenceMetadata.Collection
			subCollectionMetadata, err := metadata.GetCollection(relatedCollectionName)
			if err != nil {
				return errors.New("unable to find metadata for collection " + relatedCollectionName)
			}

			newCondition := adapt.LoadRequestCondition{}

			currentCondition.Type = "SUBQUERY"
			currentCondition.Operator = "IN"
			currentCondition.Field = fieldPart
			currentCondition.SubCollection = relatedCollectionName
			currentCondition.SubField = "uesio/core.id"
			currentCollectionMetadata = subCollectionMetadata
			currentCondition.SubConditions = []adapt.LoadRequestCondition{
				newCondition,
			}
			previousCondition = currentCondition
			currentCondition = &newCondition
		}
	}
	return nil
}

func isReferenceCrossingField(field string) bool {
	return strings.Contains(field, constant.RefSep)
}

func requestMetadataForReferenceCrossingField(collectionName, fieldName string, collections *MetadataRequest) error {
	parts := strings.Split(fieldName, constant.RefSep)
	var currentField *adapt.LoadRequestField
	var currentFieldsArray, previousFieldsArray *[]adapt.LoadRequestField
	i := len(parts) - 1
	for i >= 0 {
		previousFieldsArray = currentFieldsArray
		currentField = &adapt.LoadRequestField{
			ID: parts[i],
		}
		// If we had a previous fields array,
		// use it as subFields for this field
		currentFieldsArray = &[]adapt.LoadRequestField{
			*currentField,
		}
		if previousFieldsArray != nil {
			currentField.Fields = *previousFieldsArray
		}
		i--
	}
	subFields := getSubFields(*previousFieldsArray)
	err := collections.AddField(collectionName, currentField.ID, subFields)
	if err != nil {
		return err
	}
	return nil
}

func getMetadataForConditionLoad(
	condition *adapt.LoadRequestCondition,
	collectionName string,
	collections *MetadataRequest,
	op *adapt.LoadOp,
	ops []*adapt.LoadOp,
) error {

	var err error

	if condition.Type == "GROUP" {
		// Process sub-conditions recursively
		if len(condition.SubConditions) > 0 {
			for _, subCondition := range condition.SubConditions {
				err = getMetadataForConditionLoad(&subCondition, collectionName, collections, op, ops)
				if err != nil {
					return err
				}
			}
		}
		return nil
	} else if condition.Type == "SEARCH" {
		// Load metadata for all search fields
		if len(condition.SearchFields) > 0 {
			for _, searchField := range condition.SearchFields {
				err = collections.AddField(collectionName, searchField, nil)
				if err != nil {
					return fmt.Errorf("unable to request metadata for search field '%s' on collection '%s': %s", searchField, collectionName, err.Error())
				}
			}
		}
		return nil
	}

	if isReferenceCrossingField(condition.Field) {
		// Recursively add all pieces of the field, as if we were requesting Subfields,
		err = requestMetadataForReferenceCrossingField(collectionName, condition.Field, collections)
		if err != nil {
			return fmt.Errorf("unable to request metadata for condition field: %s", condition.Field)
		}
	} else {
		// Request metadata for the condition's main field
		err = collections.AddField(collectionName, condition.Field, nil)
		if err != nil {
			return fmt.Errorf("condition field: %v", err)
		}
	}

	if condition.Type == "SUBQUERY" {
		// Request metadata for the sub-query condition's Collection and subfield
		err = collections.AddCollection(condition.SubCollection)
		if err != nil {
			return err
		}
		err = collections.AddField(condition.SubCollection, condition.SubField, nil)
		if err != nil {
			return err
		}
		// Now, process sub-conditions recursively
		if len(condition.SubConditions) > 0 {
			for _, subCondition := range condition.SubConditions {
				err = getMetadataForConditionLoad(&subCondition, condition.SubCollection, collections, op, ops)
				if err != nil {
					return err
				}
			}
		}
	}

	if condition.ValueSource == "LOOKUP" && condition.LookupField != "" && condition.LookupWire != "" {

		// Look through the previous wires to find the one to look up on.
		var lookupCollectionKey string
		for _, otherOp := range ops {
			if otherOp.WireName == condition.LookupWire {
				lookupCollectionKey = otherOp.CollectionName
			}
		}
		lookupFields := strings.Split(condition.LookupField, constant.RefSep)
		lookupField, rest := lookupFields[0], lookupFields[1:]
		subFields := getAdditionalLookupFields(rest)

		innerErr := collections.AddField(lookupCollectionKey, lookupField, &subFields)
		if innerErr != nil {
			return fmt.Errorf("lookup field: %v", innerErr)
		}
	}
	return nil
}

func getMetadataForLoad(
	op *adapt.LoadOp,
	metadataResponse *adapt.MetadataCache,
	ops []*adapt.LoadOp,
	session *sess.Session,
) error {
	collectionKey := op.CollectionName

	// Keep a running tally of all requested collections
	collections := MetadataRequest{}
	err := collections.AddCollection(collectionKey)
	if err != nil {
		return err
	}

	for _, requestField := range op.Fields {

		if !session.GetContextPermissions().HasFieldReadPermission(collectionKey, requestField.ID) {
			return fmt.Errorf("Profile %s does not have read access to the %s field.", session.GetContextProfile(), requestField.ID)
		}

		subFields := getSubFields(requestField.Fields)
		err := collections.AddField(collectionKey, requestField.ID, subFields)
		if err != nil {
			return err
		}
	}

	for _, condition := range op.Conditions {
		innerErr := getMetadataForConditionLoad(&condition, collectionKey, &collections, op, ops)
		if innerErr != nil {
			return innerErr
		}
	}

	if len(op.Order) > 0 {
		for _, orderField := range op.Order {
			if err = getMetadataForOrderField(collectionKey, orderField.Field, &collections, session); err != nil {
				return err
			}
		}
	}

	err = collections.Load(metadataResponse, session, nil)
	if err != nil {
		return err
	}

	collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
	if err != nil {
		return err
	}

	// Now loop over fields and do some additional processing for reference & formula fields
	for i, requestField := range op.Fields {
		fieldMetadata, err := collectionMetadata.GetField(requestField.ID)
		if err != nil {
			return err
		}
		specialRef, ok := specialRefs[fieldMetadata.Type]
		if ok {
			if len(op.Fields[i].Fields) == 0 {
				for _, fieldID := range specialRef.Fields {
					op.Fields[i].Fields = append(op.Fields[i].Fields, adapt.LoadRequestField{
						ID: fieldID,
					})
				}
			}
		}

		if fieldMetadata.Type == "REFERENCE" && fieldMetadata.ReferenceMetadata.Collection != "" {
			if len(op.Fields[i].Fields) == 0 {
				refCollectionMetadata, err := metadataResponse.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
				if err != nil {
					return err
				}
				op.Fields[i].Fields = []adapt.LoadRequestField{
					{
						ID: refCollectionMetadata.NameField,
					},
					{
						ID: adapt.ID_FIELD,
					},
				}
			}
		}

		if fieldMetadata.IsFormula && fieldMetadata.FormulaMetadata != nil {
			fieldDeps, err := adapt.GetFormulaFields(fieldMetadata.FormulaMetadata.Expression)
			if err != nil {
				return err
			}
			for key := range fieldDeps {
				op.Fields = append(op.Fields, adapt.LoadRequestField{ID: key})
			}
		}
	}

	return nil

}

func getMetadataForOrderField(collectionKey string, fieldName string, collections *MetadataRequest, session *sess.Session) error {
	isReferenceCrossing := isReferenceCrossingField(fieldName)

	topLevelFieldName := fieldName

	if isReferenceCrossing {
		topLevelFieldName = strings.Split(fieldName, constant.RefSep)[0]
	}

	// Do an initial check on field read access.
	if !session.GetContextPermissions().HasFieldReadPermission(collectionKey, topLevelFieldName) {
		return fmt.Errorf("profile %s does not have read access to the %s field", session.GetContextProfile(), topLevelFieldName)
	}

	if isReferenceCrossing {
		// Recursively request metadata for all components of the reference-crossing field name
		return requestMetadataForReferenceCrossingField(collectionKey, fieldName, collections)
	} else {
		return collections.AddField(collectionKey, fieldName, nil)
	}
}

func getAdditionalLookupFields(fields []string) FieldsMap {
	if len(fields) == 0 {
		return FieldsMap{}
	}
	first, rest := fields[0], fields[1:]
	return FieldsMap{
		first: getAdditionalLookupFields(rest),
	}
}

func Load(ops []*adapt.LoadOp, session *sess.Session, options *LoadOptions) (*adapt.MetadataCache, error) {
	if options == nil {
		options = &LoadOptions{}
	}
	allOps := []*adapt.LoadOp{}
	metadataResponse := &adapt.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}

	// We do this so that we're sure that the labels are attached to the session
	if _, err := translate.GetTranslatedLabels(session); err != nil {
		return nil, err
	}

	// Loop over the ops and batch per data source
	for _, op := range ops {
		if !session.GetContextPermissions().HasCollectionReadPermission(op.CollectionName) {
			return nil, fmt.Errorf("Profile %s does not have read access to the %s collection.", session.GetContextProfile(), op.CollectionName)
		}
		// Verify that the id field is present
		hasIDField := false
		hasUniqueKeyField := false
		for i := range op.Fields {
			if op.Fields[i].ID == adapt.ID_FIELD {
				hasIDField = true
				break
			}
			if op.Fields[i].ID == adapt.UNIQUE_KEY_FIELD {
				hasUniqueKeyField = true
				break
			}
		}
		if !hasIDField {
			op.Fields = append(op.Fields, adapt.LoadRequestField{
				ID: adapt.ID_FIELD,
			})
		}

		if !hasUniqueKeyField {
			op.Fields = append(op.Fields, adapt.LoadRequestField{
				ID: adapt.UNIQUE_KEY_FIELD,
			})
		}

		if err := getMetadataForLoad(op, metadataResponse, ops, session); err != nil {
			return nil, fmt.Errorf("metadata: %s: %v", op.CollectionName, err)
		}

		//Set default order by: id - asc
		if op.Order == nil {
			op.Order = append(op.Order, adapt.LoadRequestOrder{
				Field: adapt.ID_FIELD,
				Desc:  false,
			})
		}

		if op.Query {
			allOps = append(allOps, op)
		}

	}

	// 3. Get metadata for each datasource and collection

	connection, err := GetConnection(meta.PLATFORM_DATA_SOURCE, metadataResponse, session, options.Connection)
	if err != nil {
		return nil, err
	}

	if err = GenerateUserAccessTokens(connection, session); err != nil {
		return nil, err
	}

	for _, op := range allOps {

		if err = processConditions(op.CollectionName, op.Conditions, op.Params, metadataResponse, allOps, session); err != nil {
			return nil, err
		}

		collectionMetadata, err2 := metadataResponse.GetCollection(op.CollectionName)
		if err2 != nil {
			return nil, err2
		}

		integrationName := collectionMetadata.GetIntegrationName()

		usage.RegisterEvent("LOAD", "COLLECTION", collectionMetadata.GetFullName(), 0, session)
		usage.RegisterEvent("LOAD", "DATASOURCE", integrationName, 0, session)

		if collectionMetadata.IsDynamic() {
			if err = runDynamicCollectionLoadBots(op, connection, session); err != nil {
				return nil, err
			}
			continue
		}

		if err = LoadOp(op, connection, session); err != nil {
			return nil, err
		}

	}

	return metadataResponse, nil
}

func LoadOp(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	if err := connection.Load(op, session); err != nil {
		return err
	}

	if !op.LoadAll || !op.HasMoreBatches {
		return nil
	}

	return LoadOp(op, connection, session)
}

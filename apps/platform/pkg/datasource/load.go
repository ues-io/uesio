package datasource

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/formula"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type SpecialReferences struct {
	ReferenceMetadata *wire.ReferenceMetadata
	Fields            []string
}

type MetadataInformed interface {
	SetMetadata(*wire.CollectionMetadata) error
}

func addMetadataToCollection(group meta.Group, metadata *wire.CollectionMetadata) error {
	informedGroup, isMetadataInformed := group.(MetadataInformed)
	if isMetadataInformed {
		if err := informedGroup.SetMetadata(metadata); err != nil {
			return err
		}
	}
	return nil
}

var specialRefs = map[string]SpecialReferences{
	"FILE": {
		ReferenceMetadata: &wire.ReferenceMetadata{
			Collection: "uesio/core.userfile",
		},
		Fields: []string{"uesio/core.mimetype", "uesio/core.path", "uesio/core.updatedat"},
	},
	"USER": {
		ReferenceMetadata: &wire.ReferenceMetadata{
			Collection: "uesio/core.user",
		},
		Fields: []string{"uesio/core.firstname", "uesio/core.lastname", "uesio/core.language", "uesio/core.picture"},
	},
}

type LoadOptions struct {
	Connection wire.Connection
	Metadata   *wire.MetadataCache
}

func getSubFields(loadFields []wire.LoadRequestField) *FieldsMap {
	subFields := FieldsMap{}
	for _, subField := range loadFields {
		subFields[subField.ID] = *getSubFields(subField.Fields)
	}
	return &subFields
}

func processConditions(
	op *wire.LoadOp,
	collectionKey string,
	conditions []wire.LoadRequestCondition,
	metadata *wire.MetadataCache,
	ops []*wire.LoadOp,
	session *sess.Session,
) ([]wire.LoadRequestCondition, error) {

	var err error
	var useConditions []wire.LoadRequestCondition

	currentCollectionMeta, _ := metadata.GetCollection(collectionKey)

	for i := range conditions {
		condition := conditions[i]
		if condition.Inactive {
			continue
		}
		// Convert potentially reference-crossing conditions to subquery conditions
		if isReferenceCrossingField(condition.Field) {
			// Just because it has an arrow does NOT mean it is reference-crossing, it might be a struct field,
			// in which case, we just want to leave it alone. This will mostly be relevant for external integrations.
			mainField := strings.Split(condition.Field, constant.RefSep)[0]
			// Assume it's a reference, unless we can prove otherwise
			isReferenceField := true
			if mainField != "" && currentCollectionMeta != nil {
				mainFieldMeta, err := currentCollectionMeta.GetField(mainField)
				if err == nil && !wire.IsReference(mainFieldMeta.Type) {
					isReferenceField = false
				}
			}
			// If this IS a Condition on a Reference field, then transform it to a Sub-query condition
			if isReferenceField {
				conditionPointer := &condition
				err = transformReferenceCrossingConditionToSubquery(collectionKey, conditionPointer, metadata)
				if err != nil {
					return nil, err
				}
				// Mutate the condition, otherwise the changes will be lost
				condition = *conditionPointer
			}
		}

		if condition.Type == "SUBQUERY" || condition.Type == "GROUP" {
			nestedCollection := collectionKey
			if condition.Type == "SUBQUERY" {
				nestedCollection = condition.SubCollection
			}
			if condition.SubConditions != nil {
				if useSubConditions, err := processConditions(op, nestedCollection, condition.SubConditions, metadata, ops, session); err != nil {
					return nil, err
				} else {
					condition.SubConditions = useSubConditions
				}
			}
			useConditions = append(useConditions, condition)
			continue
		}

		if condition.ValueSource == "" || condition.ValueSource == "VALUE" {

			if condition.RawValues != nil {
				condition.Values = condition.RawValues
			}

			stringValue, ok := condition.RawValue.(string)
			if !ok {
				if condition.RawValue != nil {
					condition.Value = condition.RawValue
				}
				useConditions = append(useConditions, condition)
				continue
			}

			template, err := templating.NewWithFuncs(stringValue, templating.ForceErrorFunc, merge.ServerMergeFuncs)
			if err != nil {
				return nil, err
			}

			mergedValue, err := templating.Execute(template, merge.ServerMergeData{
				Session:     session,
				ParamValues: op.Params,
			})
			if err != nil {
				return nil, err
			}

			if mergedValue == "" && condition.NoValueBehavior == "NOQUERY" {
				op.Query = false
				break
			}
			condition.Value = mergedValue
		}

		if condition.ValueSource == "PARAM" && condition.Param != "" {
			value, ok := op.Params[condition.Param]
			if !ok {
				if condition.NoValueBehavior == "DEACTIVATE" {
					continue
				}
				return nil, exceptions.NewBadRequestException("Invalid Condition, param '" + condition.Param + "' was not provided")
			}
			condition.Value = value
		}

		if condition.ValueSource == "PARAM" && len(condition.Params) > 0 {
			var values []interface{}
			for _, param := range condition.Params {
				value, ok := op.Params[param]
				if !ok {
					return nil, exceptions.NewBadRequestException("Invalid Condition, param: '" + param + "' was not provided")
				}
				values = append(values, value)
			}
			condition.Values = values
		}

		if condition.ValueSource == "LOOKUP" && condition.LookupWire != "" && condition.LookupField != "" {
			// If we weren't provided ops to lookup, just don't process Lookups
			if ops == nil {
				useConditions = append(useConditions, condition)
				continue
			}
			// Look through the previous wires to find the one to look up on.
			var lookupOp *wire.LoadOp
			for _, lop := range ops {
				if lop.WireName == condition.LookupWire {
					lookupOp = lop
					break
				}
			}

			if lookupOp == nil {
				return nil, exceptions.NewBadRequestException("Could not find lookup wire: " + condition.LookupWire)
			}

			values := make([]interface{}, 0, lookupOp.Collection.Len())
			err := lookupOp.Collection.Loop(func(item meta.Item, index string) error {
				value, err := item.GetField(condition.LookupField)
				if err != nil {
					return exceptions.NewBadRequestException("could not get value of specific Lookup field from record: " + condition.LookupField)
				}
				values = append(values, value)
				return nil
			})
			if err != nil {
				return nil, err
			}

			condition.Values = values
			//default "IN"
			if condition.Operator == "" {
				condition.Operator = "IN"
			}
			if !(condition.Operator == "IN" || condition.Operator == "NOT_IN") {
				return nil, exceptions.NewBadRequestException("Invalid operator for lookup condition, must be one of [IN, NOT_IN]: " + condition.Operator)
			}
		}
		useConditions = append(useConditions, condition)
	}

	return useConditions, nil
}

// example:
// uesio/tests.user->uesio/core.username = 'abel'
func transformReferenceCrossingConditionToSubquery(collectionName string, condition *wire.LoadRequestCondition, metadata *wire.MetadataCache) error {
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

	var previousCondition *wire.LoadRequestCondition
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
			if !wire.IsReference(referenceField.Type) || referenceField.ReferenceMetadata == nil {
				return errors.New("field " + fieldPart + " in collection " + currentCollectionMetadata.GetFullName() + " is not a valid Reference field")
			}
			relatedCollectionName := referenceField.ReferenceMetadata.GetCollection()
			subCollectionMetadata, err := metadata.GetCollection(relatedCollectionName)
			if err != nil {
				return errors.New("unable to find metadata for collection " + relatedCollectionName)
			}

			newCondition := wire.LoadRequestCondition{}

			currentCondition.Type = "SUBQUERY"
			currentCondition.Operator = "IN"
			currentCondition.Field = fieldPart
			currentCondition.SubCollection = relatedCollectionName
			currentCondition.SubField = "uesio/core.id"
			currentCollectionMetadata = subCollectionMetadata
			currentCondition.SubConditions = []wire.LoadRequestCondition{
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
	var currentField *wire.LoadRequestField
	var currentFieldsArray, previousFieldsArray *[]wire.LoadRequestField
	i := len(parts) - 1
	for i >= 0 {
		previousFieldsArray = currentFieldsArray
		currentField = &wire.LoadRequestField{
			ID: parts[i],
		}
		// If we had a previous fields array,
		// use it as subFields for this field
		currentFieldsArray = &[]wire.LoadRequestField{
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
	condition *wire.LoadRequestCondition,
	collectionName string,
	collections *MetadataRequest,
	op *wire.LoadOp,
	ops []*wire.LoadOp,
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

	if condition.ValueSource == "LOOKUP" {

		if condition.LookupWire == "" {
			return fmt.Errorf("invalid condition with valueSource 'LOOKUP': lookupWire is required")
		}
		if condition.LookupField == "" {
			return fmt.Errorf("invalid condition with valueSource 'LOOKUP': lookupField is required")
		}

		// Look through the previous wires to find the one to look up on.
		var lookupCollectionKey string
		for _, otherOp := range ops {
			if otherOp.WireName == condition.LookupWire {
				lookupCollectionKey = otherOp.CollectionName
			}
		}

		if lookupCollectionKey == "" {
			// If we've already processed this condition, we can ignore this error
			if condition.Values != nil {
				return nil
			}
			return fmt.Errorf("LOOKUP condition requested field %s from a wire named %s, but no Wire with this name was found in this load request", condition.LookupField, condition.LookupWire)
		}

		lookupFields := strings.Split(condition.LookupField, constant.RefSep)
		lookupField, rest := lookupFields[0], lookupFields[1:]
		subFields := getAdditionalLookupFields(rest)

		innerErr := collections.AddField(lookupCollectionKey, lookupField, &subFields)
		if innerErr != nil {
			return fmt.Errorf("cannot lookup field: %v", innerErr)
		}
	}
	return nil
}

func getFakeAggregateMetadata(requestField wire.LoadRequestField, collectionMetadata *wire.CollectionMetadata, fieldMetadata *wire.FieldMetadata) error {
	if requestField.Function == "" {
		return errors.New("all request fields for aggregate wires must have an aggregate function")
	}

	fieldType := "NUMBER"

	switch requestField.Function {
	case "DATE_TRUNC_DAY", "DATE_TRUNC_MONTH":
		fieldType = "DATE"
	}
	collectionMetadata.SetField(&wire.FieldMetadata{
		Name:       fieldMetadata.Name + "_" + strings.ToLower(requestField.Function),
		Namespace:  fieldMetadata.Namespace,
		Type:       fieldType,
		Accessible: true,
		Label:      fieldMetadata.Label + " " + requestField.Function,
		NumberMetadata: &wire.NumberMetadata{
			Decimals: 0,
		},
	})
	return nil
}

func GetMetadataForLoad(
	op *wire.LoadOp,
	metadataResponse *wire.MetadataCache,
	ops []*wire.LoadOp,
	session *sess.Session,
	connection wire.Connection,
) error {
	collectionKey := op.CollectionName

	op.AttachMetadataCache(metadataResponse)

	// Keep a running tally of all requested collections
	metadataRequest := &MetadataRequest{}
	if err := metadataRequest.AddCollection(collectionKey); err != nil {
		return err
	}

	for _, requestField := range op.Fields {

		if requestField.ViewOnlyMetadata != nil {
			getMetadataForViewOnlyField(requestField, metadataRequest)
			continue
		}

		if !session.GetContextPermissions().HasFieldReadPermission(collectionKey, requestField.ID) {
			return exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have read access to the %s field.", session.GetContextProfile(), requestField.ID))
		}

		subFields := getSubFields(requestField.Fields)
		err := metadataRequest.AddField(collectionKey, requestField.ID, subFields)
		if err != nil {
			return err
		}
	}

	if op.Aggregate {
		for _, requestField := range op.GroupBy {
			err := metadataRequest.AddField(collectionKey, requestField.ID, nil)
			if err != nil {
				return err
			}
		}
	}

	for _, condition := range op.Conditions {
		innerErr := getMetadataForConditionLoad(&condition, collectionKey, metadataRequest, op, ops)
		if innerErr != nil {
			return innerErr
		}
	}

	if len(op.Order) > 0 {
		for _, orderField := range op.Order {
			if err := getMetadataForOrderField(collectionKey, orderField.Field, metadataRequest, session); err != nil {
				return err
			}
		}
	}

	if err := metadataRequest.Load(metadataResponse, session, connection); err != nil {
		return err
	}

	collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
	if err != nil {
		return err
	}

	// Now loop over fields and do some additional processing for reference & formula fields
	for i, requestField := range op.Fields {
		if requestField.ViewOnlyMetadata != nil {
			continue
		}
		fieldMetadata, err := collectionMetadata.GetField(requestField.ID)
		if err != nil {
			return err
		}
		specialRef, ok := specialRefs[fieldMetadata.Type]
		if ok {
			if len(op.Fields[i].Fields) == 0 {
				for _, fieldID := range specialRef.Fields {
					op.Fields[i].Fields = append(op.Fields[i].Fields, wire.LoadRequestField{
						ID: fieldID,
					})
				}
			}
		}

		if fieldMetadata.Type == "REFERENCE" && len(op.Fields[i].Fields) == 0 {
			if fieldMetadata.ReferenceMetadata.MultiCollection {
				op.Fields[i].Fields = []wire.LoadRequestField{
					{
						ID: commonfields.Id,
					},
					{
						ID: commonfields.Collection,
					},
				}
			} else {
				refCollectionMetadata, err := metadataResponse.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection())
				if err != nil {
					return err
				}
				op.Fields[i].Fields = []wire.LoadRequestField{
					{
						ID: refCollectionMetadata.NameField,
					},
					{
						ID: commonfields.Id,
					},
				}
			}
		}
		if fieldMetadata.IsFormula && fieldMetadata.FormulaMetadata != nil {
			fieldDeps, err := formula.GetFormulaFields(session.Context(), fieldMetadata.FormulaMetadata.Expression)
			if err != nil {
				return err
			}
			for key := range fieldDeps {
				op.Fields = append(op.Fields, wire.LoadRequestField{ID: key})
			}
		}

		// Add fake metadata to our aggregate fields
		if op.Aggregate {
			err := getFakeAggregateMetadata(requestField, collectionMetadata, fieldMetadata)
			if err != nil {
				return err
			}
		}
	}

	// Now loop over group by fields and do some additional processing
	if op.Aggregate {
		for _, requestField := range op.GroupBy {
			if requestField.Function == "" {
				continue
			}
			fieldMetadata, err := collectionMetadata.GetField(requestField.ID)
			if err != nil {
				return err
			}
			err = getFakeAggregateMetadata(requestField, collectionMetadata, fieldMetadata)
			if err != nil {
				return err
			}
		}
	}

	return nil

}

func getMetadataForViewOnlyField(
	field wire.LoadRequestField,
	metadataRequest *MetadataRequest,
) {
	viewOnlyMeta := field.ViewOnlyMetadata
	if viewOnlyMeta != nil {
		switch viewOnlyMeta.Type {
		case "SELECT", "MULTISELECT":
			if viewOnlyMeta.SelectListMetadata != nil && viewOnlyMeta.SelectListMetadata.Name != "" {
				metadataRequest.AddSelectList(viewOnlyMeta.SelectListMetadata.Name)
			}
		}
	}
}

func GetMetadataForViewOnlyWire(
	op *wire.LoadOp,
	metadataResponse *wire.MetadataCache,
	connection wire.Connection,
	session *sess.Session,
) error {
	metadataRequest := &MetadataRequest{}
	for _, requestField := range op.Fields {
		getMetadataForViewOnlyField(requestField, metadataRequest)
	}
	// TBD : WHY does connection have to be nil?
	return metadataRequest.Load(metadataResponse, session, connection)
}

func getMetadataForOrderField(collectionKey string, fieldName string, metadataRequest *MetadataRequest, session *sess.Session) error {
	isReferenceCrossing := isReferenceCrossingField(fieldName)

	topLevelFieldName := fieldName

	if isReferenceCrossing {
		topLevelFieldName = strings.Split(fieldName, constant.RefSep)[0]
	}

	// Do an initial check on field read access.
	if !session.GetContextPermissions().HasFieldReadPermission(collectionKey, topLevelFieldName) {
		return exceptions.NewForbiddenException(fmt.Sprintf("profile %s does not have read access to the %s field", session.GetContextProfile(), topLevelFieldName))
	}

	if isReferenceCrossing {
		// Recursively request metadata for all components of the reference-crossing field name
		return requestMetadataForReferenceCrossingField(collectionKey, fieldName, metadataRequest)
	} else {
		return metadataRequest.AddField(collectionKey, fieldName, nil)
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

func GetDefaultOrder() wire.LoadRequestOrder {
	return wire.LoadRequestOrder{
		Field: commonfields.Id,
		Desc:  false,
	}
}

// getOpsNeedingRecordLevelAccessCheck filters a list of LoadOps to only those that need a record-level access check
// for the purposes of performing the provided queries.
func getOpsNeedingRecordLevelAccessCheck(ops []*wire.LoadOp, metadataResponse *wire.MetadataCache, userPerms *meta.PermissionSet) ([]*wire.LoadOp, error) {
	var opsNeedingRecordLevelAccessCheck []*wire.LoadOp
	for _, op := range ops {
		if op.ViewOnly {
			continue
		}
		collectionMetadata, err := metadataResponse.GetCollection(op.CollectionName)
		if err != nil {
			return nil, err
		}
		// If we don't need a record level access check at all, move on.
		needsAccessCheck := collectionMetadata.IsReadProtected() || (collectionMetadata.IsWriteProtected() && op.RequireWriteAccess)
		if !needsAccessCheck {
			continue
		}
		// Check whether the running user has view all / modify all records permission for the collection,
		// depending on whether the op requires write access or not.

		var userCanViewAllRecords bool
		if op.RequireWriteAccess {
			userCanViewAllRecords = userPerms.HasModifyAllRecordsPermission(op.CollectionName)
		} else {
			userCanViewAllRecords = userPerms.HasViewAllRecordsPermission(op.CollectionName)
		}

		// if the user cannot view all records, then we need to do a record-level access check for this op
		if !userCanViewAllRecords {
			opsNeedingRecordLevelAccessCheck = append(opsNeedingRecordLevelAccessCheck, op)
		}
	}
	return opsNeedingRecordLevelAccessCheck, nil
}

func Load(ops []*wire.LoadOp, session *sess.Session, options *LoadOptions) (*wire.MetadataCache, error) {
	if options == nil {
		options = &LoadOptions{}
	}
	var allOps []*wire.LoadOp
	var err error
	metadataResponse := &wire.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}

	connection, err := GetConnection(meta.PLATFORM_DATA_SOURCE, session, options.Connection)
	if err != nil {
		return nil, err
	}

	// Loop over the ops and batch per data source
	for _, op := range ops {

		// Attach the collection metadata to the LoadOp so that Load Bots can access it
		op.AttachMetadataCache(metadataResponse)
		// Special processing for View-only wires
		if op.ViewOnly {
			if err = GetMetadataForViewOnlyWire(op, metadataResponse, connection, session); err != nil {
				return nil, err
			}
			continue
		}

		if !session.GetContextPermissions().HasCollectionReadPermission(op.CollectionName) {
			return nil, exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have read access to the %s collection.", session.GetContextProfile(), op.CollectionName))
		}
		// Verify that the id field is present
		hasIDField := false
		hasUniqueKeyField := false
		for i := range op.Fields {
			if op.Fields[i].ID == commonfields.Id {
				hasIDField = true
				break
			}
			if op.Fields[i].ID == commonfields.UniqueKey {
				hasUniqueKeyField = true
				break
			}
		}

		if !hasIDField && !op.Aggregate {
			op.Fields = append(op.Fields, wire.LoadRequestField{
				ID: commonfields.Id,
			})
		}

		if !hasUniqueKeyField && !op.Aggregate {
			op.Fields = append(op.Fields, wire.LoadRequestField{
				ID: commonfields.UniqueKey,
			})
		}

		if err = GetMetadataForLoad(op, metadataResponse, ops, session, connection); err != nil {
			return nil, err
		}

		//Set default order by: id - asc
		if op.Order == nil && !op.Aggregate {
			op.Order = append(op.Order, GetDefaultOrder())
		}

		if op.Query {
			allOps = append(allOps, op)
		}

	}

	userPerms := session.GetContextPermissions()

	// Do an initial loop to determine whether or not we need to do record-level access checks
	// for the current user. If we do, then we need to generate access tokens and send this in to the load implementations.
	// If we don't, then we can skip this step.
	opsNeedingRecordLevelAccessCheck, err := getOpsNeedingRecordLevelAccessCheck(ops, metadataResponse, userPerms)
	if err != nil {
		return nil, err
	}
	if len(opsNeedingRecordLevelAccessCheck) > 0 {
		// Attach user access tokens to the session
		if err = GenerateUserAccessTokens(connection, metadataResponse, session); err != nil {
			return nil, err
		}
		for _, op := range opsNeedingRecordLevelAccessCheck {
			op.SetNeedsRecordLevelAccessCheck()
		}
	}

	for _, op := range allOps {
		if op.ViewOnly {
			continue
		}
		// In order to prevent Uesio DB, Dynamic Collections, and External Integration load bots from each separately
		// needing to manually filter out inactive conditions, we will instead do that here, as part of processConditions,
		// which will return a list of active Conditions (and this is recursive, so that sub-conditions of GROUP, SUBQUERY,
		// etc. will also only include active condiitons).
		// We will temporarily mutate the load op's conditions so that all load implementations will now have only active
		// conditions, and then we will, at the end of the operation, restore them back.
		// NOTICE that this activeConditions slice is NOT a pointer, it's a value, so it is functionally a clone
		// of the original conditions, which we need to preserve as is so that the client can know what the original state was.
		originalConditions := op.Conditions
		originalQuery := op.Query
		activeConditions, err := processConditions(op, op.CollectionName, originalConditions, metadataResponse, allOps, session)
		if err != nil {
			return nil, err
		}

		// The op could have been cancelled in the process conditions step, so we need
		// to check op.Query again.
		if !op.Query {
			op.Query = originalQuery
			continue
		}

		collectionMetadata, err := metadataResponse.GetCollection(op.CollectionName)
		if err != nil {
			return nil, err
		}

		if err = addMetadataToCollection(op.Collection, collectionMetadata); err != nil {
			return nil, err
		}

		collectionKey := collectionMetadata.GetFullName()

		integrationName := collectionMetadata.GetIntegrationName()

		usage.RegisterEvent("LOAD", "COLLECTION", collectionKey, 0, session)
		usage.RegisterEvent("LOAD", "DATASOURCE", integrationName, 0, session)

		// Mutate the conditions immediately before handing off to the load implementations
		op.Conditions = activeConditions

		// 3 branches:
		// 1. Dynamic collections
		// 2. External integration collections
		// 3. Native Uesio DB collections
		var loadErr error
		if collectionMetadata.IsDynamic() {
			// Dynamic collection loads
			loadErr = runDynamicCollectionLoadBots(op, connection, session)
		} else if integrationName != "" && integrationName != meta.PLATFORM_DATA_SOURCE {
			// external integration loads
			loadErr = performExternalIntegrationLoad(integrationName, op, connection, session)
		} else {
			// native Uesio DB loads
			loadErr = LoadOp(op, connection, session)
		}
		// Regardless of what happened with the load, restore the original conditions list now that we're done
		op.Conditions = originalConditions

		if loadErr != nil {
			return nil, loadErr
		}
	}

	return metadataResponse, nil
}

func performExternalIntegrationLoad(integrationName string, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := GetIntegrationConnection(integrationName, session, connection)
	if err != nil {
		return err
	}
	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}
	op.AttachIntegrationConnection(integrationConnection)
	integrationType := integrationConnection.GetIntegrationType()
	// If there's a collection-specific load bot defined, use that,
	// otherwise default to the integration's defined load bot.
	// If there's neither, then there's nothing to do.
	botKey := collectionMetadata.LoadBot
	if botKey == "" && integrationType != nil {
		botKey = integrationType.LoadBot
	}
	if err = runExternalDataSourceLoadBot(botKey, op, connection, session); err != nil {
		return err
	}
	return nil
}

// LoadOp loads one operation within a sequence.
// WARNING!!! This is not a shortcut for Load(ops...)---DO NOT CALL THIS unless you know what you're doing
func LoadOp(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	if err := connection.Load(op, session); err != nil {
		return err
	}

	if !op.LoadAll || !op.HasMoreBatches {
		return nil
	}

	return LoadOp(op, connection, session)
}

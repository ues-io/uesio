package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// PlatformSaveRequest struct
type PlatformSaveRequest struct {
	Collection meta.CollectionableGroup
	Options    *adapt.SaveOptions
}

// RecordNotFoundError struct
type RecordNotFoundError struct {
	message string
}

func (e *RecordNotFoundError) Error() string { return e.message }

// NewRecordNotFoundError creates a new record not found error
func NewRecordNotFoundError(message string) *RecordNotFoundError {
	return &RecordNotFoundError{
		message: message,
	}
}

func GetLoadRequestFields(fieldStrings []string) []adapt.LoadRequestField {
	fields := []adapt.LoadRequestField{}
	for _, field := range fieldStrings {
		fields = append(fields, adapt.LoadRequestField{
			ID: field,
		})
	}
	return fields
}

// PlatformLoads function
func PlatformLoads(ops []adapt.LoadOp, session *sess.Session) error {

	_, err := Load(ops, session)
	if err != nil {
		return errors.New("Platform LoadFromSite Failed:" + err.Error())
	}

	return nil
}

// PlatformLoad function
func PlatformLoad(group meta.CollectionableGroup, conditions []adapt.LoadRequestCondition, session *sess.Session) error {
	return PlatformLoadWithFields(group, GetLoadRequestFields(group.GetFields()), conditions, session)
}

// PlatformLoadWithFields function
func PlatformLoadWithFields(group meta.CollectionableGroup, fields []adapt.LoadRequestField, conditions []adapt.LoadRequestCondition, session *sess.Session) error {
	return PlatformLoads([]adapt.LoadOp{
		{
			WireName:       group.GetName() + "Wire",
			CollectionName: group.GetName(),
			Collection:     group,
			Conditions:     conditions,
			Fields:         fields,
		},
	}, session)
}

// PlatformLoadWithOrder function
func PlatformLoadWithOrder(group meta.CollectionableGroup, orders []adapt.LoadRequestOrder, conditions []adapt.LoadRequestCondition, session *sess.Session) error {
	return PlatformLoads([]adapt.LoadOp{
		{
			WireName:       group.GetName() + "Wire",
			CollectionName: group.GetName(),
			Collection:     group,
			Conditions:     conditions,
			Order:          orders,
			Fields:         GetLoadRequestFields(group.GetFields()),
		},
	}, session)
}

// PlatformLoadOne function
func PlatformLoadOne(item meta.CollectionableItem, conditions []adapt.LoadRequestCondition, session *sess.Session) error {
	return PlatformLoadOneWithFields(item, nil, conditions, session)
}

func PlatformLoadOneWithFields(item meta.CollectionableItem, fields []adapt.LoadRequestField, conditions []adapt.LoadRequestCondition, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}

	if fields == nil {
		fields = GetLoadRequestFields(collection.GetFields())
	}

	err := PlatformLoadWithFields(collection, fields, conditions, session)
	if err != nil {
		return err
	}

	length := collection.Len()

	if length == 0 {
		return NewRecordNotFoundError("Couldn't find item from platform load: " + collection.GetName())
	}
	if length > 1 {
		return errors.New("Duplicate item found from platform load: " + collection.GetName())
	}

	return nil
}

// PlatformDelete function
func PlatformDelete(request meta.CollectionableGroup, session *sess.Session) error {
	return DoPlatformSave([]SaveRequest{{
		Wire:       "deleteRequest",
		Collection: request.GetName(),
		Deletes:    request,
	}}, session)
}

func PlatformDeleteOne(item meta.CollectionableItem, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}
	return PlatformDelete(collection, session)
}

func GetSaveRequestFromPlatformSave(psr PlatformSaveRequest) SaveRequest {
	return SaveRequest{
		Collection: psr.Collection.GetName(),
		Wire:       "AnyKey",
		Changes:    psr.Collection,
		Options:    psr.Options,
	}
}

// PlatformSaves function
func PlatformSaves(psrs []PlatformSaveRequest, session *sess.Session) error {
	requests := make([]SaveRequest, len(psrs))
	for i := range psrs {
		requests[i] = GetSaveRequestFromPlatformSave(psrs[i])
	}
	return DoPlatformSave(requests, session)
}

func HandleSaveRequestErrors(requests []SaveRequest) error {
	for _, request := range requests {
		if request.Errors != nil {
			if len(request.Errors) > 0 {
				return errors.New(request.Errors[0].Error())
			}
		}
	}
	return nil
}

func DoPlatformSave(requests []SaveRequest, session *sess.Session) error {
	err := Save(requests, session)
	if err != nil {
		return err
	}
	return HandleSaveRequestErrors(requests)
}

// PlatformSave function
func PlatformSave(psr PlatformSaveRequest, session *sess.Session) error {
	return PlatformSaves([]PlatformSaveRequest{
		psr,
	}, session)
}

func PlatformSaveOne(item meta.CollectionableItem, options *adapt.SaveOptions, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}
	return PlatformSave(PlatformSaveRequest{
		Collection: collection,
		Options:    options,
	}, session)
}

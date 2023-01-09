package datasource

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type PlatformLoadOptions struct {
	Conditions []adapt.LoadRequestCondition
	Fields     []adapt.LoadRequestField
	Orders     []adapt.LoadRequestOrder
	Connection adapt.Connection
	BatchSize  int
	LoadAll    bool
}

func (plo *PlatformLoadOptions) GetConditionsDebug() string {
	conditionStrings := []string{}
	for _, c := range plo.Conditions {
		conditionStrings = append(conditionStrings, fmt.Sprintf("%s :: %s", c.Field, c.Value))
	}
	return strings.Join(conditionStrings, " ")
}

type RecordNotFoundError struct {
	message string
}

func (e *RecordNotFoundError) Error() string { return e.message }

func NewRecordNotFoundError(message string) *RecordNotFoundError {
	return &RecordNotFoundError{
		message: message,
	}
}

func getLoadRequestFields(fieldStrings []string) []adapt.LoadRequestField {
	fields := []adapt.LoadRequestField{}
	for _, field := range fieldStrings {
		fields = append(fields, adapt.LoadRequestField{
			ID: field,
		})
	}
	return fields
}

func PlatformLoad(group meta.CollectionableGroup, options *PlatformLoadOptions, session *sess.Session) error {

	if options == nil {
		options = &PlatformLoadOptions{}
	}
	fields := options.Fields
	if fields == nil {
		fields = getLoadRequestFields(group.GetFields())
	}
	return doPlatformLoad(&adapt.LoadOp{
		WireName:       group.GetName() + "Wire",
		CollectionName: group.GetName(),
		Collection:     group,
		Conditions:     options.Conditions,
		Fields:         fields,
		Order:          options.Orders,
		Query:          true,
		BatchSize:      options.BatchSize,
		LoadAll:        options.LoadAll,
	}, options.Connection, session)
}

func doPlatformLoad(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
	_, err := Load([]*adapt.LoadOp{op}, session, &LoadOptions{
		Connections: GetConnectionMap(connection),
		Metadata:    GetConnectionMetadata(connection),
	})
	if err != nil {
		return errors.New("Platform LoadFromSite Failed:" + err.Error())
	}

	if op.LoadAll && op.HasMoreBatches {
		return doPlatformLoad(op, connection, session)
	}

	return nil
}

func PlatformLoadOne(item meta.CollectionableItem, options *PlatformLoadOptions, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}

	err := PlatformLoad(collection, options, session)
	if err != nil {
		return err
	}

	length := collection.Len()

	if length == 0 {
		return NewRecordNotFoundError("Couldn't find item from platform load: " + collection.GetName() + " : " + options.GetConditionsDebug())
	}
	if length > 1 {
		return fmt.Errorf("Duplicate item found from platform load: %s (%v)", collection.GetName()+" : "+options.GetConditionsDebug(), length)
	}

	return nil
}

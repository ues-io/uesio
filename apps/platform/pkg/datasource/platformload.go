package datasource

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type PlatformLoadOptions struct {
	Conditions         []wire.LoadRequestCondition
	Fields             []wire.LoadRequestField
	Orders             []wire.LoadRequestOrder
	Connection         wire.Connection
	BatchSize          int
	LoadAll            bool
	Params             map[string]string
	RequireWriteAccess bool
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

func GetLoadRequestFields(fieldStrings []string) []wire.LoadRequestField {
	fields := []wire.LoadRequestField{}
	for _, field := range fieldStrings {
		fields = append(fields, wire.LoadRequestField{
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
		fields = GetLoadRequestFields(group.GetFields())
	}
	return doPlatformLoad(&wire.LoadOp{
		WireName:           group.GetName() + "Wire",
		CollectionName:     group.GetName(),
		Collection:         group,
		Conditions:         options.Conditions,
		Fields:             fields,
		Order:              options.Orders,
		Query:              true,
		BatchSize:          options.BatchSize,
		Params:             options.Params,
		RequireWriteAccess: options.RequireWriteAccess,
	}, options, session)
}

func doPlatformLoad(op *wire.LoadOp, options *PlatformLoadOptions, session *sess.Session) error {
	_, err := Load([]*wire.LoadOp{op}, session, &LoadOptions{
		Connection: options.Connection,
		Metadata:   GetConnectionMetadata(options.Connection),
	})
	if err != nil {
		return errors.New("Platform LoadFromSite Failed:" + err.Error())
	}

	if options.LoadAll && op.HasMoreBatches {
		return doPlatformLoad(op, options, session)
	}

	return nil
}

func PlatformLoadOne(item meta.CollectionableItem, options *PlatformLoadOptions, session *sess.Session) error {
	collection := &LoadOneCollection{
		Item: item,
	}

	if err := PlatformLoad(collection, options, session); err != nil {
		return err
	}

	length := collection.Len()

	collectionName := collection.GetName()

	if length == 0 {
		return NewRecordNotFoundError(fmt.Sprintf("Couldn't find item from platform load: Collection=%s, Conditions=%v", collectionName, options.GetConditionsDebug()))
	}
	if length > 1 {
		return fmt.Errorf("Duplicate item found from platform load: %s (%v)", collectionName+" : "+options.GetConditionsDebug(), length)
	}

	return nil
}

func PlatformLoadByID(item meta.CollectionableItem, id string, session *sess.Session, connection wire.Connection) error {
	return PlatformLoadOne(
		item,
		&PlatformLoadOptions{
			Connection: connection,
			Conditions: []wire.LoadRequestCondition{
				{
					Field: wire.ID_FIELD,
					Value: id,
				},
			},
		},
		session,
	)
}

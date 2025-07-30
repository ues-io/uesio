package datasource

import (
	"context"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type PlatformLoadOptions struct {
	Conditions         []wire.LoadRequestCondition
	Fields             []wire.LoadRequestField
	Orders             []wire.LoadRequestOrder
	Connection         wire.Connection
	BatchSize          int
	LoadAll            bool
	Params             map[string]any
	RequireWriteAccess bool
	WireName           string
}

func (plo *PlatformLoadOptions) GetConditionsDebug() string {
	conditionStrings := make([]string, len(plo.Conditions))
	for i, c := range plo.Conditions {
		conditionStrings[i] = fmt.Sprintf("%s :: %s", c.Field, c.Value)
	}
	return strings.Join(conditionStrings, " ")
}

func GetLoadRequestFields(fieldStrings []string) []wire.LoadRequestField {
	fields := make([]wire.LoadRequestField, len(fieldStrings))
	for i, field := range fieldStrings {
		fields[i] = wire.LoadRequestField{
			ID: field,
		}
	}
	return fields
}

func PlatformLoad(ctx context.Context, group meta.CollectionableGroup, options *PlatformLoadOptions, session *sess.Session) error {

	if options == nil {
		options = &PlatformLoadOptions{}
	}
	fields := options.Fields
	if fields == nil {
		fields = GetLoadRequestFields(group.GetFields())
	}
	return doPlatformLoad(ctx, &wire.LoadOp{
		WireName:           "Platform Load: " + options.WireName,
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

func doPlatformLoad(ctx context.Context, op *wire.LoadOp, options *PlatformLoadOptions, session *sess.Session) error {
	err := LoadWithError(ctx, op, session, &LoadOptions{
		Connection: options.Connection,
	})
	if err != nil {
		return err
	}

	if options.LoadAll && op.HasMoreBatches {
		return doPlatformLoad(ctx, op, options, session)
	}

	return nil
}

func PlatformLoadOne(ctx context.Context, item meta.CollectionableItem, options *PlatformLoadOptions, session *sess.Session) error {
	collection := &LoadOneCollection{
		Item: item,
	}

	if err := PlatformLoad(ctx, collection, options, session); err != nil {
		return err
	}

	length := collection.Len()

	collectionName := collection.GetName()

	if length == 0 {
		return exceptions.NewNotFoundException(fmt.Sprintf("couldn't find item from platform load: Collection=%s, Conditions=%v", collectionName, options.GetConditionsDebug()))
	}
	if length > 1 {
		return exceptions.NewDuplicateException(fmt.Sprintf("duplicate item found from platform load: %s (%v)", collectionName+" : "+options.GetConditionsDebug(), length))
	}

	return nil
}

func PlatformLoadByID(ctx context.Context, item meta.CollectionableItem, id string, session *sess.Session, connection wire.Connection) error {
	return PlatformLoadOne(
		ctx,
		item,
		&PlatformLoadOptions{
			Connection: connection,
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.Id,
					Value: id,
				},
			},
		},
		session,
	)
}

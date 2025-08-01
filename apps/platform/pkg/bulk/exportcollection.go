package bulk

import (
	"context"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func exportCollection(ctx context.Context, create bundlestore.FileCreator, spec *meta.JobSpec, session *sess.Session) error {
	metadataResponse, err := getBatchMetadata(ctx, spec.Collection, session)
	if err != nil {
		return err
	}

	//Load operation
	fields := []wire.LoadRequestField{}
	collectionMetadata, err := metadataResponse.GetCollection(spec.Collection)
	if err != nil {
		return err
	}

	for _, fieldMetadata := range collectionMetadata.Fields {
		// For reference fields, lets just request the id for now
		if wire.IsReference(fieldMetadata.Type) {
			fields = append(fields, wire.LoadRequestField{
				ID: fieldMetadata.GetFullName(),
				Fields: []wire.LoadRequestField{
					{
						ID: commonfields.Id,
					},
				},
			})
			continue
		}
		fields = append(fields, wire.LoadRequestField{
			ID: fieldMetadata.GetFullName(),
		})
	}

	file, err := create(strings.ReplaceAll(spec.Collection, "/", "_") + ".csv")
	if err != nil {
		return err
	}

	var collection meta.Group

	if spec.FileType == "CSV" {
		collection = NewCSVExportCollection(file, collectionMetadata)
	}

	if collection == nil {
		return fmt.Errorf("cannot process that file type: %s", spec.FileType)
	}

	return datasource.LoadWithError(ctx, &wire.LoadOp{
		WireName:       "uesio_data_export",
		CollectionName: spec.Collection,
		Collection:     collection,
		Fields:         fields,
		Query:          true,
		LoadAll:        true,
	}, session, nil)

}

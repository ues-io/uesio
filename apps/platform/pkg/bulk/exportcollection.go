package bulk

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func exportCollection(create bundlestore.FileCreator, spec *meta.JobSpec, session *sess.Session) error {
	metadataResponse, err := getBatchMetadata(spec.Collection, session)
	if err != nil {
		return err
	}

	//Load operation
	fields := []adapt.LoadRequestField{}
	collectionMetadata, err := metadataResponse.GetCollection(spec.Collection)
	if err != nil {
		return err
	}

	for _, fieldMetadata := range collectionMetadata.Fields {
		// For reference fields, lets just request the id for now
		if adapt.IsReference(fieldMetadata.Type) {
			fields = append(fields, adapt.LoadRequestField{
				ID: fieldMetadata.GetFullName(),
				Fields: []adapt.LoadRequestField{
					{
						ID: adapt.ID_FIELD,
					},
				},
			})
			continue
		}
		fields = append(fields, adapt.LoadRequestField{
			ID: fieldMetadata.GetFullName(),
		})
	}

	file, err := create(fmt.Sprintf("%s.csv", strings.ReplaceAll(spec.Collection, "/", "_")))
	if err != nil {
		return err
	}

	var collection meta.Group

	if spec.FileType == "CSV" {
		collection = NewCSVExportCollection(file, collectionMetadata)
	}

	if collection == nil {
		return errors.New("Cannot process that file type: " + spec.FileType)
	}

	_, err = datasource.Load([]*adapt.LoadOp{{
		WireName:       "uesio_data_export",
		CollectionName: spec.Collection,
		Collection:     collection,
		Fields:         fields,
		Query:          true,
		LoadAll:        true,
	}}, session, nil)
	if err != nil {
		return err
	}

	return err

}

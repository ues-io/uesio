package bulk

import (
	"encoding/csv"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getMappings(columnNames []string, spec *meta.JobSpec, session *sess.Session) ([]meta.FieldMapping, *adapt.MetadataCache, error) {

	metadataResponse := adapt.MetadataCache{}
	mappings := []meta.FieldMapping{}
	// Keep a running tally of all requested collections
	collections := datasource.MetadataRequest{}
	err := collections.AddCollection(spec.Collection)
	if err != nil {
		return nil, nil, err
	}
	for _, columnName := range columnNames {
		mapping, ok := spec.Mappings[columnName]
		if !ok {
			mapping = meta.FieldMapping{
				FieldName: columnName,
			}
		}
		mappings = append(mappings, mapping)
		err := collections.AddField(spec.Collection, mapping.FieldName, nil)
		if err != nil {
			return nil, nil, err
		}
	}

	err = collections.Load(nil, &metadataResponse, session)
	if err != nil {
		return nil, nil, err
	}

	return mappings, &metadataResponse, nil
}

func getLookups(mappings []meta.FieldMapping, collectionMetadata *adapt.CollectionMetadata) ([]adapt.Lookup, error) {
	lookups := []adapt.Lookup{}
	for _, mapping := range mappings {
		fieldMetadata, err := collectionMetadata.GetField(mapping.FieldName)
		if err != nil {
			return nil, err
		}
		if fieldMetadata.Type == "REFERENCE" {
			lookups = append(lookups, adapt.Lookup{
				RefField:   mapping.FieldName,
				MatchField: mapping.MatchField,
			})
		}
	}
	return lookups, nil
}

func processCSV(body io.ReadCloser, spec *meta.JobSpec, session *sess.Session) ([]datasource.SaveRequest, error) {

	r := csv.NewReader(body)
	changes := adapt.Collection{}

	// Handle the header row
	headerRow, err := r.Read()
	if err != nil {
		return nil, err
	}

	mappings, metadata, err := getMappings(headerRow, spec, session)
	if err != nil {
		return nil, err
	}

	collectionMetadata, err := metadata.GetCollection(spec.Collection)
	if err != nil {
		return nil, err
	}

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		changeRequest := adapt.Item{}

		for index, mapping := range mappings {
			fieldName := mapping.FieldName
			fieldMetadata, err := collectionMetadata.GetField(fieldName)
			if err != nil {
				return nil, err
			}
			if fieldMetadata.Type == "CHECKBOX" {
				changeRequest[mapping.FieldName] = record[index] == "true"
			} else if fieldMetadata.Type == "REFERENCE" {

				refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
				if err != nil {
					return nil, err
				}

				matchField := refCollectionMetadata.NameField

				if mapping.MatchField != "" {
					matchField = mapping.MatchField
				}

				changeRequest[mapping.FieldName] = map[string]interface{}{
					matchField: record[index],
				}
			} else {
				changeRequest[mapping.FieldName] = record[index]
			}
		}

		changes = append(changes, changeRequest)

	}

	lookups, err := getLookups(mappings, collectionMetadata)
	if err != nil {
		return nil, err
	}
	return []datasource.SaveRequest{
		{
			Collection: spec.Collection,
			Wire:       "bulkupload",
			Changes:    &changes,
			Options: &adapt.SaveOptions{
				Upsert: &adapt.UpsertOptions{
					MatchField:    spec.UpsertKey,
					MatchTemplate: "${" + spec.UpsertKey + "}",
				},
				Lookups: lookups,
			},
		},
	}, nil
}

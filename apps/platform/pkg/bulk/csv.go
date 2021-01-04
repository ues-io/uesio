package bulk

import (
	"encoding/csv"
	"io"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

func getMappings(columnNames []string, spec *metadata.JobSpec, session *sess.Session) ([]metadata.FieldMapping, *adapters.MetadataCache, error) {
	collatedMetadata := map[string]*adapters.MetadataCache{}
	metadataResponse := adapters.MetadataCache{}
	mappings := []metadata.FieldMapping{}
	// Keep a running tally of all requested collections
	collections := datasource.MetadataRequest{}
	err := collections.AddCollection(spec.Collection)
	if err != nil {
		return nil, nil, err
	}
	for _, columnName := range columnNames {
		mapping, ok := spec.Mappings[columnName]
		if !ok {
			mapping = metadata.FieldMapping{
				FieldName: columnName,
			}
		}
		mappings = append(mappings, mapping)
		err := collections.AddField(spec.Collection, mapping.FieldName, nil)
		if err != nil {
			return nil, nil, err
		}
	}

	err = collections.Load(&metadataResponse, collatedMetadata, session)
	if err != nil {
		return nil, nil, err
	}

	return mappings, &metadataResponse, nil
}

func getLookups(mappings []metadata.FieldMapping, collectionMetadata *adapters.CollectionMetadata) ([]reqs.Lookup, error) {
	lookups := []reqs.Lookup{}
	for _, mapping := range mappings {
		fieldMetadata, err := collectionMetadata.GetField(mapping.FieldName)
		if err != nil {
			return nil, err
		}
		if fieldMetadata.Type == "REFERENCE" {
			lookups = append(lookups, reqs.Lookup{
				RefField:   mapping.FieldName,
				MatchField: mapping.MatchField,
			})
		}
	}
	return lookups, nil
}

func processCSV(body io.ReadCloser, spec *metadata.JobSpec, session *sess.Session) (*datasource.SaveRequestBatch, error) {

	r := csv.NewReader(body)
	changes := map[string]reqs.ChangeRequest{}

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

	changeIndex := 0
	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		changeRequest := reqs.ChangeRequest{
			FieldChanges: map[string]interface{}{},
		}

		for index, mapping := range mappings {
			fieldName := mapping.FieldName
			fieldMetadata, err := collectionMetadata.GetField(fieldName)
			if err != nil {
				return nil, err
			}
			if fieldMetadata.Type == "CHECKBOX" {
				changeRequest.FieldChanges[mapping.FieldName] = record[index] == "true"
			} else if fieldMetadata.Type == "REFERENCE" {

				refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
				if err != nil {
					return nil, err
				}

				matchField := refCollectionMetadata.NameField

				if mapping.MatchField != "" {
					matchField = mapping.MatchField
				}

				changeRequest.FieldChanges[mapping.FieldName] = map[string]interface{}{
					matchField: record[index],
				}
			} else {
				changeRequest.FieldChanges[mapping.FieldName] = record[index]
			}
		}

		changes[strconv.Itoa(changeIndex)] = changeRequest

		changeIndex++

	}

	lookups, err := getLookups(mappings, collectionMetadata)
	if err != nil {
		return nil, err
	}
	return &datasource.SaveRequestBatch{
		Wires: []reqs.SaveRequest{
			{
				Collection: spec.Collection,
				Wire:       "bulkupload",
				Changes:    changes,
				Options: &reqs.SaveOptions{
					Upsert: &reqs.UpsertOptions{
						MatchField:    spec.UpsertKey,
						MatchTemplate: "${" + spec.UpsertKey + "}",
					},
					Lookups: lookups,
				},
			},
		},
	}, nil
}

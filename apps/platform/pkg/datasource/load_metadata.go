package datasource

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/formula"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type SpecialReferences struct {
	ReferenceMetadata *wire.ReferenceMetadata
	Fields            []string
}

type MetadataInformed interface {
	SetMetadata(*wire.CollectionMetadata) error
}

func GetDefaultOrder() wire.LoadRequestOrder {
	return wire.LoadRequestOrder{
		Field: commonfields.Id,
		Desc:  false,
	}
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
		Fields: []string{"uesio/core.mimetype", "uesio/core.path", "uesio/core.updatedat", "uesio/core.fieldid"},
	},
	"USER": {
		ReferenceMetadata: &wire.ReferenceMetadata{
			Collection: "uesio/core.user",
		},
		Fields: []string{"uesio/core.firstname", "uesio/core.lastname", "uesio/core.language", "uesio/core.picture"},
	},
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
	ctx context.Context,
	op *wire.LoadOp,
	metadataResponse *wire.MetadataCache,
	ops []*wire.LoadOp,
	session *sess.Session,
	connection wire.Connection,
) error {
	collectionKey := op.CollectionName

	op.AttachMetadataCache(metadataResponse)

	metadataRequest, err := GetMetadataRequestForLoad(op, ops, session)
	if err != nil {
		return err
	}

	err = metadataRequest.Load(ctx, metadataResponse, session, connection)
	if err != nil {

		return err
	}

	collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
	if err != nil {
		return exceptions.NewForbiddenException("your profile has no access to the " + collectionKey + " collection")
	}

	// Now loop over fields and do some additional processing for reference & formula fields
	for i, requestField := range op.Fields {
		if requestField.ViewOnlyMetadata != nil {
			continue
		}
		fieldMetadata, err := collectionMetadata.GetField(requestField.ID)
		if err != nil {
			// Allow missing metadata for dynamic collections because it could be added
			// by the custom handler.
			if collectionMetadata.IsDynamic() {
				continue
			}
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
			fieldDeps, err := formula.GetFormulaFields(ctx, fieldMetadata.FormulaMetadata.Expression)
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
	ctx context.Context,
	op *wire.LoadOp,
	metadataResponse *wire.MetadataCache,
	connection wire.Connection,
	session *sess.Session,
) error {
	metadataRequest := &MetadataRequest{}
	for _, requestField := range op.Fields {
		getMetadataForViewOnlyField(requestField, metadataRequest)
	}
	return metadataRequest.Load(ctx, metadataResponse, session, connection)
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

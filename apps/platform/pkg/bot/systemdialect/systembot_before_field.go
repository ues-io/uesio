package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runFieldBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	depMap := MetadataDependencyMap{}

	workspaceID, err := GetWorkspaceIDFromParams(request.Params, connection, session)
	if err != nil {
		return err
	}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {

		ftype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil {
			return err
		}

		_, ok := meta.GetFieldTypes()[ftype]
		if !ok {
			return errors.New("Invalid Field Type for Field: " + ftype)
		}

		err = depMap.AddRequired(change, "collection", "uesio/studio.collection")
		if err != nil {
			return err
		}

		err = depMap.AddOptional(change, "label", "uesio/studio.languagelabel")
		if err != nil {
			return err
		}

		_, err = change.GetField("uesio/studio.validate")
		if err == nil {
			validateType, _ := change.GetFieldAsString("uesio/studio.validate->uesio/studio.type")
			if validateType == "REGEX" {
				err = depMap.AddRequired(change, "field", "uesio/studio.validate->uesio/studio.regex")
				if err != nil {
					return err
				}
			}
		}

		switch ftype {
		case "FILE":
			_, err := requireValue(change, "uesio/studio.file->uesio/studio.accept")
			if err != nil {
				return err
			}
		case "SELECT", "MULTISELECT":
			err = depMap.AddRequired(change, "selectlist", "uesio/studio.selectlist")
			if err != nil {
				return err
			}
		case "REFERENCE":
			isMultiCollection, err := change.GetField("uesio/studio.reference->uesio/studio.multicollection")
			if err != nil {
				return err
			}
			if isMultiCollection == nil || isMultiCollection.(bool) == false {
				err = depMap.AddRequired(change, "collection", "uesio/studio.reference->uesio/studio.collection")
				if err != nil {
					return err
				}
			}
		case "FORMULA":

			_, err := requireValue(change, "uesio/studio.formula->uesio/studio.expression")
			if err != nil {
				return err
			}

			_, err = requireValue(change, "uesio/studio.formula->uesio/studio.returntype")
			if err != nil {
				return err
			}

		}

		return nil
	})
	if err != nil {
		return err
	}

	items, err := depMap.GetItems()
	if err != nil {
		return err
	}

	return checkValidItems(workspaceID, items, session, connection)

}

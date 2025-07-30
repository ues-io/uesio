package systemdialect

import (
	"context"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runFeatureFlagLoadBot(ctx context.Context, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	var userID string
	// Currently, this doesn't work for regular contexts
	if session.GetWorkspace() != nil {
		userID = session.GetContextUser().ID
	}
	if session.GetSiteAdmin() != nil {
		userCondition := extractConditionByField(op.Conditions, "userid")
		if userCondition == nil {
			return errors.New("you must provide a user condition in the site admin context")
		}
		if userCondition.Value != nil {
			var ok bool
			userID, ok = userCondition.Value.(string)
			if !ok {
				return errors.New("invalid user condition value")
			}
		}
		if userCondition.Values != nil {
			values, ok := userCondition.Values.([]any)
			if !ok {
				return errors.New("invalid user condition value")
			}
			userID, ok = values[0].(string)
			if !ok {
				return errors.New("invalid user condition value")
			}
		}
	}

	if userID == "" {
		return errors.New("no user id provided to feature flag load")
	}

	featureFlags, err := featureflagstore.GetFeatureFlags(ctx, session, userID)
	if err != nil {
		return fmt.Errorf("failed to get feature flags: %w", err)
	}

	var orgOnly bool

	orgCondition := extractConditionByField(op.Conditions, "org")

	if orgCondition != nil && orgCondition.Value == true {
		orgOnly = true
	}

	for _, flag := range *featureFlags {

		if orgOnly && !flag.ValidForOrgs {
			continue
		}
		opItem := op.Collection.NewItem()
		err := opItem.SetField("uesio/core.name", flag.Name)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.namespace", flag.Namespace)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.type", flag.Type)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.value", flag.Value)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.label", flag.Label)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.has_value", flag.HasValue)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.userid", flag.User)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.id", flag.Namespace+"."+flag.Name+":"+flag.User)
		if err != nil {
			return err
		}
		err = op.Collection.AddItem(opItem)
		if err != nil {
			return err
		}
	}

	return nil
}

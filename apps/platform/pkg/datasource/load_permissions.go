package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func opNeedsRecordLevelAccessCheck(op *wire.LoadOp, collectionMetadata *wire.CollectionMetadata, userPerms *meta.PermissionSet, session *sess.Session) bool {
	if op.ViewOnly {
		return false
	}

	// If we don't need a record level access check at all, move on.
	needsAccessCheck := collectionMetadata.IsReadProtected() || (collectionMetadata.IsWriteProtected() && op.RequireWriteAccess)
	if !needsAccessCheck {
		return false
	}

	// Special case for workspace mode and users
	if session.GetWorkspace() != nil && op.CollectionName == "uesio/core.user" {
		return true
	}

	// Check whether the running user has view all / modify all records permission for the collection,
	// depending on whether the op requires write access or not.

	var userCanViewAllRecords bool
	if op.RequireWriteAccess {
		userCanViewAllRecords = userPerms.HasModifyAllRecordsPermission(op.CollectionName)
	} else {
		userCanViewAllRecords = userPerms.HasViewAllRecordsPermission(op.CollectionName)
	}

	// if the user cannot view all records, then we need to do a record-level access check for this op
	return !userCanViewAllRecords
}

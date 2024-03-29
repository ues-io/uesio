package workspace

func NewWorkspaceAccessResult(workspaceKeyInfo KeyInfo, hasWriteAccess, isSiteAdmin bool, err error) *AccessResult {
	return &AccessResult{
		hasWriteAccess: hasWriteAccess,
		isSiteAdmin:    isSiteAdmin,
		err:            err,
		KeyInfo:        workspaceKeyInfo,
	}
}

type AccessResult struct {
	hasWriteAccess bool
	isSiteAdmin    bool
	err            error
	KeyInfo
}

func (t *AccessResult) Error() error {
	return t.err
}

func (t *AccessResult) HasWriteAccess() bool {
	return t.hasWriteAccess
}

func (t *AccessResult) IsSiteAdmin() bool {
	return t.isSiteAdmin
}

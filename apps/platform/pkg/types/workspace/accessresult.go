package workspace

func NewWorkspaceAccessResult(workspaceKeyInfo KeyInfo, hasWriteAccess bool, err error) *AccessResult {
	return &AccessResult{
		hasWriteAccess: hasWriteAccess,
		err:            err,
		KeyInfo:        workspaceKeyInfo,
	}
}

type AccessResult struct {
	hasWriteAccess bool
	err            error
	KeyInfo
}

func (t *AccessResult) Error() error {
	return t.err
}

func (t *AccessResult) HasWriteAccess() bool {
	return t.hasWriteAccess
}

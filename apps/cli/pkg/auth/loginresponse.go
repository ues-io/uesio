package auth

import "github.com/thecloudmasters/uesio/pkg/preload"

// TODO: All of the login paths return the full preload.LoginResponse & preload.UserMergeData. The previous version
// of the CLI created its own LoginResponse & UserMergeData type that only contained the properties needed for the CLI.
// However, this creates risk and additional maintenance overhead where the only tiny benefit is a little bit of
// processing during unmarshalling since the server is sending the full LoginResponse/UserMergeData payload anyway.
// Since we do not need a lot of the properties on LoginResponse/UserMergeData in the CLI, if/when the server side
// methodsare refactored to have "base" info and "full" info and only use "full" where needed, this can be adjusted
// to use the "base" info. For now, eliminating the maintenance/risks and just aliasing the preload types
// that are actually being returned.
type UserMergeData = preload.UserMergeData
type LoginResponse = preload.LoginResponse

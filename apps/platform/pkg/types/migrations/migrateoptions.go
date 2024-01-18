package migrations

type MigrateOptions struct {
	// If true, then down migrations will be run, instead of up.
	// Defaults to false.
	Down bool
	// The number of migrations to run in the indicated direction.
	// If 0 (default), then all possible migrations will be run.
	Number int
}

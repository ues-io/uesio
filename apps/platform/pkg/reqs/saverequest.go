package reqs

// Lookup struct
type Lookup struct {
	RefField   string // The name of the reference field to lookup
	MatchField string // The name of the field to use to match based on provided data
}

// UpsertOptions struct
type UpsertOptions struct {
	MatchField    string // The field to pull from the database to determine a match
	MatchTemplate string // The template to use against the provided change data to equal the match field
}

// SaveOptions struct
type SaveOptions struct {
	Upsert  *UpsertOptions
	Lookups []Lookup
}

// SaveRequest struct
type SaveRequest struct {
	Collection string
	Wire       string
	Changes    map[string]ChangeRequest
	Deletes    map[string]DeleteRequest
	Options    *SaveOptions
}

// GetCollection function
func (sr *SaveRequest) GetCollection() string {
	return sr.Collection
}

// GetWire function
func (sr *SaveRequest) GetWire() string {
	return sr.Wire
}

// ChangeRequest struct
type ChangeRequest map[string]interface{}

// DeleteRequest struct
type DeleteRequest map[string]interface{}

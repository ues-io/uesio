package bot

type BotResponse struct {
	Params  map[string]interface{} `json:"params"`
	Success bool                   `json:"success"`
	Error   string                 `json:"error"`
}

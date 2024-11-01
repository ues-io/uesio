package ns

type MetadataResponse struct {
	NamespaceInfo `json:",inline"`
	Key           string `json:"key"`
	Label         string `json:"label"`
}

type NamespaceInfo struct {
	Color       string `json:"color"`
	Icon        string `json:"icon"`
	Namespace   string `json:"namespace"`
	Description string `json:"description"`
}

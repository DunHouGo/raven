export const getLinkFieldSearchAPIPath = (doctype: string): string =>
	doctype === "Item" ? "raven.api.document_search.search_items" : "frappe.desk.search.search_link"

/** Return the user-facing label for a DocType value without changing its API value. */
export const getLinkFieldDisplayLabel = (
	doctype: string,
	value: string,
	fallback = value,
	language = typeof window === "undefined" ? "" : window.frappe?.boot?.lang || "",
): string => {
	if (doctype !== "DocType") return fallback
	if (value === "Item") return language.startsWith("zh") ? "商品" : "Product"
	if (value === "Communication") return "Email"
	if (value === "Wiki Document") return "Knowledge Base"
	return fallback
}

/** Prefer an email's subject to its opaque Communication ID in search results. */
export const getLinkFieldResultDisplay = (
	doctype: string,
	item: { value: string; label?: string; description?: string },
): { label: string; description: string } => {
	const fallbackLabel = String(item.label || item.value)
	const description = item.description == null ? "" : String(item.description)
	if (doctype === "Communication" && description && description !== fallbackLabel) {
		return { label: description, description: item.value }
	}
	return {
		label: fallbackLabel,
		description: description !== fallbackLabel ? description : "",
	}
}

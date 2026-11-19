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

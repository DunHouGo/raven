export const getLinkFieldSearchAPIPath = (doctype: string): string =>
	doctype === "Item" ? "raven.api.document_search.search_items" : "frappe.desk.search.search_link"

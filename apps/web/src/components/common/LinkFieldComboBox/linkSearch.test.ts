import { describe, expect, it } from "vitest"
import { getLinkFieldSearchAPIPath } from "./linkSearch"

describe("getLinkFieldSearchAPIPath", () => {
	it("uses product search for Item links", () => {
		expect(getLinkFieldSearchAPIPath("Item")).toBe("raven.api.document_search.search_items")
	})

	it("keeps Frappe link search for other doctypes", () => {
		expect(getLinkFieldSearchAPIPath("Customer")).toBe("frappe.desk.search.search_link")
	})
})

import { describe, expect, it } from "vitest"
import { getLinkFieldDisplayLabel, getLinkFieldResultDisplay, getLinkFieldSearchAPIPath } from "./linkSearch"

describe("getLinkFieldSearchAPIPath", () => {
	it("uses product search for Item links", () => {
		expect(getLinkFieldSearchAPIPath("Item")).toBe("raven.api.document_search.search_items")
	})

	it("keeps Frappe link search for other doctypes", () => {
		expect(getLinkFieldSearchAPIPath("Customer")).toBe("frappe.desk.search.search_link")
	})

	it("shows Item as Product while keeping the DocType value", () => {
		expect(getLinkFieldDisplayLabel("DocType", "Item", "Item")).toBe("Product")
		expect(getLinkFieldDisplayLabel("DocType", "Item", "物料", "zh-CN")).toBe("商品")
		expect(getLinkFieldDisplayLabel("DocType", "Item", "Item", "zh-CN")).toBe("商品")
		expect(getLinkFieldDisplayLabel("DocType", "Customer", "Customer")).toBe("Customer")
	})

	it("uses translated labels for email and knowledge document types", () => {
		expect(getLinkFieldDisplayLabel("DocType", "Communication")).toBe("Email")
		expect(getLinkFieldDisplayLabel("DocType", "Wiki Document")).toBe("Knowledge Base")
	})

	it("shows an email subject as the primary label and its ID as secondary text", () => {
		expect(getLinkFieldResultDisplay("Communication", {
			value: "2v9d41in0o",
			description: "Fw: Makito shipment update",
		})).toEqual({
			label: "Fw: Makito shipment update",
			description: "2v9d41in0o",
		})
	})
})

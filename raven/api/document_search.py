from __future__ import annotations

from typing import Any

import frappe

ITEM_SEARCH_FIELD_TYPES = {
	"Autocomplete",
	"Data",
	"Link",
	"Long Text",
	"Read Only",
	"Select",
	"Small Text",
	"Text",
	"Text Editor",
}
ITEM_SEARCH_FIELDS = (
	"item_name",
	"description",
	"item_group",
	"brand",
	"customer_code",
	"custom_product_size",
	"custom_product_material",
	"custom_product_use",
	"custom_product_category",
	"custom_product_remarks",
	"custom_product_public_name_zh",
	"custom_product_public_name_en",
	"custom_product_public_slug",
	"custom_product_tags",
)


def get_item_search_fields(meta: Any) -> list[str]:
	"""Return searchable Item text fields supported by this site's metadata."""
	permitted_fields = set(
		meta.get_permitted_fieldnames(permission_type="read", with_virtual_fields=False)
	)
	return [
		"name",
		*[
			fieldname
			for fieldname in ITEM_SEARCH_FIELDS
			if fieldname in permitted_fields
			and (field := meta.get_field(fieldname))
			and field.fieldtype in ITEM_SEARCH_FIELD_TYPES
		],
	]


def _parse_filters(filters: str | list | dict | None) -> list[list]:
	if not filters:
		return []
	parsed = frappe.parse_json(filters) if isinstance(filters, str) else filters
	if isinstance(parsed, dict):
		return [["Item", fieldname, "=", value] for fieldname, value in parsed.items()]
	return parsed if isinstance(parsed, list) else []


def _get_tagged_item_names(txt: str, limit: int) -> list[str]:
	if not txt or not frappe.db.exists("DocType", "Tag Link"):
		return []
	if not frappe.has_permission("Tag Link", "read"):
		return []
	tags = frappe.get_list(
		"Tag Link",
		filters={"document_type": "Item", "tag": ["like", f"%{txt}%"]},
		fields=["document_name"],
		page_length=min(limit * 5, 250),
	)
	return list(dict.fromkeys(row.document_name for row in tags if row.document_name))


@frappe.whitelist()
def search_items(
	txt: str = "", page_length: int = 20, filters: str | list | dict | None = None
) -> list[dict[str, str]]:
	"""Search readable products by SKU, product details, and document tags."""
	frappe.has_permission("Item", "read", throw=True)
	query = (txt or "").strip()
	limit = max(1, min(int(page_length or 20), 50))
	meta = frappe.get_meta("Item")
	permitted_fields = set(
		meta.get_permitted_fieldnames(permission_type="read", with_virtual_fields=False)
	)
	search_fields = get_item_search_fields(meta)
	item_filters = []
	for condition in _parse_filters(filters):
		if not isinstance(condition, list) or not condition:
			continue
		fieldname = condition[1] if len(condition) >= 4 and condition[0] == "Item" else condition[0]
		if fieldname in permitted_fields:
			item_filters.append(condition)
	if "disabled" in permitted_fields:
		item_filters.append(["Item", "disabled", "=", 0])
	if "has_variants" in permitted_fields:
		item_filters.append(["Item", "has_variants", "=", 0])

	or_filters = [["Item", fieldname, "like", f"%{query}%"] for fieldname in search_fields] if query else []
	result_fields = [
		fieldname
		for fieldname in ["name", "item_name", "description"]
		if fieldname == "name" or fieldname in permitted_fields
	]
	items = frappe.get_list(
		"Item",
		filters=item_filters,
		or_filters=or_filters,
		fields=result_fields,
		page_length=limit,
		order_by=f"{'item_name asc, ' if 'item_name' in permitted_fields else ''}name asc",
	)

	matched_names = _get_tagged_item_names(query, limit)
	if matched_names:
		tag_items = frappe.get_list(
			"Item",
			filters=[*item_filters, ["Item", "name", "in", matched_names]],
			fields=result_fields,
			page_length=limit,
			order_by=f"{'item_name asc, ' if 'item_name' in permitted_fields else ''}name asc",
		)
		known_names = {item.name for item in tag_items}
		items = [*tag_items, *(item for item in items if item.name not in known_names)]

	return [
		{
			"value": item.name,
			"label": item.get("item_name") or item.name,
			"description": " · ".join(
				value for value in [item.name, item.get("description")] if value
			)
			or item.name,
		}
		for item in items[:limit]
	]

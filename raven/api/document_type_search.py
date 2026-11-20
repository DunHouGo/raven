from __future__ import annotations

import frappe
from frappe import _

COMMON_DOCUMENT_TYPES = (
    "Sales Order",
    "Item",
    "Communication",
    "Wiki Document",
    "Customer",
)
PINNED_DOCUMENT_TYPES = ("Communication", "Wiki Document")
MAX_RECENT_DOCUMENT_TYPES = 3
MAX_SUGGESTED_DOCUMENT_TYPES = 5
DOCUMENT_TYPE_SEARCH_ALIASES = {
    "Item": ("product", "商品"),
    "Communication": ("email", "mail", "邮件", "邮件记录", "邮箱", "电子邮件"),
    "Wiki Document": ("wiki", "knowledge", "knowledge base", "知识库", "知识库文章"),
}


def _parse_recent_document_types(recent_doctypes: str | list[str] | None) -> list[str]:
    """解析并限制最近使用的单据类型。"""
    if isinstance(recent_doctypes, str):
        try:
            recent_doctypes = frappe.parse_json(recent_doctypes)
        except (TypeError, ValueError):
            return []
    if not isinstance(recent_doctypes, list):
        return []
    return list(
        dict.fromkeys(
            name
            for name in recent_doctypes
            if isinstance(name, str)
            and name.strip()
            and name not in COMMON_DOCUMENT_TYPES
        )
    )[:MAX_RECENT_DOCUMENT_TYPES]


def _aliased_document_type_names(query: str) -> list[str]:
    """按中英文关键词返回匹配的单据类型名称。"""
    needle = query.casefold()
    return [
        name
        for name, aliases in DOCUMENT_TYPE_SEARCH_ALIASES.items()
        if any(
            needle in alias.casefold() or alias.casefold() in needle
            for alias in aliases
        )
    ]


@frappe.whitelist(methods=["GET"])
def search_document_types(
    txt: str = "", page_length: int = 20, recent_doctypes: str | list[str] | None = None
) -> list[dict[str, str]]:
    """搜索当前用户可读取的单据类型，并在空查询时返回少量建议项。"""
    query = (txt or "").strip().casefold()
    limit = max(1, min(int(page_length or 20), 50))
    readable_types = set(frappe.get_user().get_can_read()) - {"DocType"}
    if query:
        candidates = dict.fromkeys(
            [
                *_aliased_document_type_names(query),
                *(
                    name
                    for name in sorted(readable_types)
                    if query in name.casefold() or query in _(name).casefold()
                ),
            ]
        )
    else:
        recent = _parse_recent_document_types(recent_doctypes)
        pinned = [name for name in PINNED_DOCUMENT_TYPES if name in readable_types]
        remaining = [
            name
            for name in COMMON_DOCUMENT_TYPES
            if name not in PINNED_DOCUMENT_TYPES
        ]
        candidates = dict.fromkeys([*recent, *pinned, *remaining])
        limit = min(limit, MAX_SUGGESTED_DOCUMENT_TYPES)

    results: list[dict[str, str]] = []
    for name in candidates:
        if name not in readable_types:
            continue
        meta = frappe.get_meta(name)
        if meta.issingle or meta.istable:
            continue
        results.append({"value": name, "label": name, "description": meta.module or ""})
        if len(results) == limit:
            break
    return results

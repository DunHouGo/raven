from contextlib import ExitStack
from unittest import TestCase
from unittest.mock import patch

import frappe

from raven.api.document_type_search import search_document_types


class TestDocumentTypeSearch(TestCase):
    def setUp(self) -> None:
        stack = ExitStack()
        self.addCleanup(stack.close)
        user = stack.enter_context(
            patch("raven.api.document_type_search.frappe.get_user")
        )
        self.readable_types = user.return_value.get_can_read
        self.get_meta = stack.enter_context(
            patch("raven.api.document_type_search.frappe.get_meta")
        )
        self.get_meta.side_effect = lambda name: frappe._dict(
            issingle=name == "Sales Settings",
            istable=name == "Sales Order Item",
            module="Selling",
        )
        self.translate = stack.enter_context(
            patch("raven.api.document_type_search._", side_effect=lambda name: name)
        )

    def test_empty_search_excludes_other_types_and_respects_read_permissions(
        self,
    ) -> None:
        self.readable_types.return_value = [
            "Item",
            "Customer",
            "Wiki Document",
            "Purchase Order",
        ]
        self.assertEqual(
            [row["value"] for row in search_document_types()],
            ["Wiki Document", "Item", "Customer"],
        )
        self.get_meta.assert_any_call("Wiki Document")
        self.assertNotIn(
            "Communication", [call.args[0] for call in self.get_meta.call_args_list]
        )

    def test_suggestions_prioritize_up_to_three_recent_types_and_keep_five_total(
        self,
    ) -> None:
        self.readable_types.return_value = [
            "Custom A",
            "Custom B",
            "Custom C",
            "Custom D",
            "Sales Order",
            "Item",
            "Customer",
            "Communication",
            "Wiki Document",
        ]
        recent = '["Custom A", "Custom A", "Custom B", "Custom C", "Custom D"]'
        self.assertEqual(
            [row["value"] for row in search_document_types(recent_doctypes=recent)],
            [
                "Custom A",
                "Custom B",
                "Custom C",
                "Communication",
                "Wiki Document",
            ],
        )

    def test_knowledge_base_and_email_remain_suggested_after_a_recent_type(self) -> None:
        self.readable_types.return_value = [
            "Purchase Order",
            "Sales Order",
            "Item",
            "Customer",
            "Communication",
            "Wiki Document",
        ]
        self.assertEqual(
            [
                row["value"]
                for row in search_document_types(
                    recent_doctypes='["Purchase Order"]'
                )
            ],
            [
                "Purchase Order",
                "Communication",
                "Wiki Document",
                "Sales Order",
                "Item",
            ],
        )

    def test_search_excludes_settings_and_child_tables(self) -> None:
        self.readable_types.return_value = [
            "Sales Invoice",
            "Sales Order",
            "Sales Order Item",
            "Sales Settings",
        ]
        self.assertEqual(
            [row["value"] for row in search_document_types(txt="sales")],
            ["Sales Invoice", "Sales Order"],
        )
        self.assertEqual(
            [row["value"] for row in search_document_types(txt="sales", page_length=1)],
            ["Sales Invoice"],
        )

    def test_search_includes_visible_names_and_translations(self) -> None:
        self.readable_types.return_value = [
            "Communication",
            "Wiki Document",
            "Sales Order",
            "DocType",
            "Item",
        ]
        self.translate.side_effect = lambda name: (
            "销售订单" if name == "Sales Order" else name
        )
        for query, name in (
            ("邮件", "Communication"),
            ("知识库", "Wiki Document"),
            ("销售订单", "Sales Order"),
            ("商品", "Item"),
        ):
            with self.subTest(query=query):
                self.assertEqual(
                    [row["value"] for row in search_document_types(txt=query)], [name]
                )
        self.assertEqual(search_document_types(txt="DocType"), [])

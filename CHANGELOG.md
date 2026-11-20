# 更新日志

## 2026-11-20

- Added channel avatars and channel actions to the sidebar context menu for the Smart ERP fork.
- Profile identity and photo editing remain in ERP settings; Raven keeps availability and custom status controls.
- Raven 的姓名、电话和头像由 ERP 设置统一维护；Raven 设置页保留在线状态和自定义状态。
- 将邮件主题作为单据搜索结果的主标题，Communication ID 降为次要信息；知识库与邮件类型固定保留在五项建议中，避免最近使用类型挤掉知识库。
- 将聊天单据类型搜索放入独立接口模块，按当前用户可读类型筛选，并将建议数量限制为五项；支持邮件、知识库和商品的中文搜索。
- 邮件记录选择限定 Email 类型的 Communication；修正单据卡片中商品、邮件及知识库类型标签，并为打开、置顶和频道状态使用上下文明确的词条。

## 2026-11-19

- 修复聊天附加单据的权限和建议项：默认最多显示五种常用或最近使用类型，其余需搜索；邮件和知识库使用 `Communication`、`Wiki Document`，并按当前用户的读取权限过滤单据类型。
- 修正聊天单据的打开、置顶、频道公开状态和投票状态标签，避免通用的 `Open`、`Pin` 被底座译成“待处理”或“销”。
- 修复 Raven 聊天商品选择器因商品字段权限不足而搜索失败的问题。

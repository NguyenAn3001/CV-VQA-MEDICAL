# Plan: Overhaul start-task Skill — Add Git Branch & PR Workflow

## Objective
Sửa skill `start-task` để tự động tạo branch từ main, commit, push, tạo PR (nếu có gh), và quản lý tasks.md metadata.

## Files to Modify
- `.agents/skills/start-task/SKILL.md` — Rewrite workflow: thêm 11 steps + git guards
- `agents/tasks.md` — Update format: thêm metadata (Branch, Plan, Status, timestamps)
- `agents/changelog.md` — Ghi changelog cho thay đổi này

## Files to Create
- `agents/plans/2026-07-08_1334-overhaul-start-task-skill.md` — Plan này

## Implementation Steps
1. Rewrite SKILL.md: 11-step workflow (Pre-flight → Context → Branch → Plan → Code → Test → Changelog → Commit → PR → Mark done → Report)
2. Thêm git guards trước mọi git command (xác nhận đúng branch)
3. Update tasks.md: thêm Branch/Plan/Status/Created/Completed fields
4. Create plan file
5. Update changelog

## Test Plan
- [ ] Đọc lại SKILL.md: 11 steps đầy đủ, guards đúng vị trí
- [ ] tasks.md: mọi task có metadata, format nhất quán

## Risks
- tasks.md format thay đổi có thể ảnh hưởng skill `add-task` nếu nó parse format cũ

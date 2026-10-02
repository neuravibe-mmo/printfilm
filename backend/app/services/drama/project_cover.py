"""Bìa danh sách dự án phim truyền hình truyện tranh: Hiển thị hình ảnh từ phân tích bảng phân cảnh/nội dung."""

from __future__ import annotations

from app.models_drama import DramaProject


# Phân tích URL bìa dự án và liệu nó có cần được tạo hay không
def resolve_drama_project_cover(project: DramaProject) -> tuple[str | None, bool]:
    cover_url: str | None = None
    cover_pending = False

    episodes = sorted(project.episodes or [], key=lambda e: e.id)
    for episode in episodes:
        fragments = sorted(episode.fragments or [], key=lambda f: (f.sort_order, f.id))
        for fragment in fragments:
            media = (fragment.cover or "").strip() or (fragment.video or "").strip()
            if media:
                return media, False
            if (fragment.content or "").strip():
                cover_pending = True

    for asset in sorted(project.assets or [], key=lambda a: a.id):
        if (asset.asset_type or "").lower() == "voice":
            continue
        media = (asset.cover or "").strip() or (asset.url or "").strip()
        if media:
            return media, False

    return cover_url, cover_pending

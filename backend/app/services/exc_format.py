"""Định dạng các ngoại lệ thành văn bản lỗi có thể hiển thị, không trống."""

from __future__ import annotations

# Đã thiết lập kết nối, hết thời gian chờ phản hồi (không thể kết nối)
_READ_TIMEOUT_EXC_NAMES = frozenset({"ReadTimeout"})
# Kết nối đã được thiết lập và nội dung yêu cầu đã hết thời gian chờ.
_WRITE_TIMEOUT_EXC_NAMES = frozenset({"WriteTimeout"})
# Không thiết lập được kết nối/Không thể truy cập tác nhân (bao gồm cả Ngoại lệ hết thời gian chờ)
_CONNECT_EXC_NAMES = frozenset(
    {
        "ConnectError",
        "ConnectTimeout",
        "PoolTimeout",
        "TimeoutException",
        "NetworkError",
        "ProxyError",
    }
)


def format_exception_message(
    exc: BaseException,
    *,
    fallback: str = "未知错误",
    limit: int = 500,
) -> str:
    """Tạo văn bản lỗi với tên loại; thêm mô tả có thể đọc được khi ConnectError và các tin nhắn trống khác."""
    name = type(exc).__name__
    detail = str(exc).strip()
    if name in _READ_TIMEOUT_EXC_NAMES:
        tip = detail or "上游已连通但响应超时（图片/视频生成可能超过等待上限）"
        return f"网络错误（{name}）：{tip}"[:limit]
    if name in _WRITE_TIMEOUT_EXC_NAMES:
        tip = detail or "上游已连通但发送请求超时"
        return f"网络错误（{name}）：{tip}"[:limit]
    if name in _CONNECT_EXC_NAMES:
        tip = detail or "无法连接上游服务（请检查网络、代理或 TokenFree 是否可达）"
        return f"网络错误（{name}）：{tip}"[:limit]
    if not detail:
        return f"{name}：{fallback}"[:limit]
    if detail.startswith(name):
        return detail[:limit]
    return f"{name}: {detail}"[:limit]

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SettingsSaveAction = {
  onSave: () => void | Promise<void>;
  saving?: boolean;
  label?: string;
};

type SettingsSaveContextValue = {
  action: SettingsSaveAction | null;
  registerSave: (action: SettingsSaveAction | null) => void;
};

const SettingsSaveContext = createContext<SettingsSaveContextValue | null>(null);

// Trang cài đặt: Tab phụ đăng ký hành động lưu và tiêu đề hiển thị nút "Lưu" thống nhất
export function SettingsSaveProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<SettingsSaveAction | null>(null);
  const registerSave = useCallback((next: SettingsSaveAction | null) => {
    setAction((prev) => {
      if (!prev && !next) return prev;
      if (
        prev &&
        next &&
        prev.saving === next.saving &&
        (prev.label ?? "保存") === (next.label ?? "保存")
      ) {
        // Đồng bộ hóa onSave mới nhất để tránh hết hạn đóng; không kích hoạt các phụ thuộc kết xuất lại vô nghĩa
        prev.onSave = next.onSave;
        return prev;
      }
      return next;
    });
  }, []);
  const value = useMemo(() => ({ action, registerSave }), [action, registerSave]);
  return <SettingsSaveContext.Provider value={value}>{children}</SettingsSaveContext.Provider>;
}

export function useSettingsSaveSlot() {
  const ctx = useContext(SettingsSaveContext);
  if (!ctx) {
    throw new Error("useSettingsSaveSlot must be used within SettingsSaveProvider");
  }
  return ctx;
}

// Tab Đăng ký và lưu khi gắn kết; rõ ràng khi gỡ cài đặt
export function useRegisterSettingsSave(action: SettingsSaveAction | null) {
  const { registerSave } = useSettingsSaveSlot();
  useEffect(() => {
    registerSave(action);
    return () => registerSave(null);
  }, [action, registerSave]);
}

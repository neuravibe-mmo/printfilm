import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  api,
  type AdminLedger,
  type AdminOrder,
  type AdminUsageEvent,
  type AdminUserRow,
  type PageMeta,
} from "@/api/client";
import {
  AdminDetailMeta,
  AdminDetailSection,
  AdminDetailTableWrap,
} from "@/components/admin/AdminDetailLayout";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { AdminModal } from "@/components/admin/AdminModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAccountId } from "@/lib/admin-account";
import { formatCredits } from "@/lib/utils";
import { useI18n, formatDateTime } from "@/i18n";

type ListRes<T> = { items: T[]; meta: PageMeta };

type UserDetailDrawerProps = {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser?: AdminUserRow | null;
};

/** 用户只读明细：基本信息 + 订单/流水/用量聚合 */
export function UserDetailDrawer({ userId, open, onOpenChange, initialUser }: UserDetailDrawerProps) {
  const { t, locale } = useI18n();
  const [user, setUser] = useState<AdminUserRow | null>(initialUser ?? null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ledger, setLedger] = useState<AdminLedger[]>([]);
  const [usage, setUsage] = useState<AdminUsageEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    void (async () => {
      try {
        const [userRes, orderRes, ledgerRes, usageRes] = await Promise.all([
          initialUser?.id === userId
            ? Promise.resolve({ items: [initialUser], meta: { page: 1, page_size: 1, total: 1 } })
            : api<ListRes<AdminUserRow>>(`/api/admin/users?page=1&page_size=1&q=${userId}`),
          api<ListRes<AdminOrder>>(`/api/admin/orders?page=1&page_size=8&user_id=${userId}`),
          api<ListRes<AdminLedger>>(`/api/admin/ledger?page=1&page_size=8&user_id=${userId}`),
          api<ListRes<AdminUsageEvent>>(`/api/admin/usage-events?page=1&page_size=20&user_id=${userId}`),
        ]);
        setUser(userRes.items[0] ?? initialUser ?? null);
        setOrders(orderRes.items);
        setLedger(ledgerRes.items);
        setUsage(usageRes.items);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("userDetail.loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, userId, initialUser, t]);

  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={t("userDetail.title")}
      subtitle={
        user
          ? `${user.email} · ID: ${formatAccountId(user.id)}`
          : loading
            ? t("common.loading")
            : "—"
      }
      bodyClassName="!pt-2"
    >
      {user ? (
        <Tabs defaultValue="info" className="admin-detail-tabs">
          <TabsList>
            <TabsTrigger value="info">{t("userDetail.baseInfo")}</TabsTrigger>
            <TabsTrigger value="orders">{t("userDetail.tabs.orders")}</TabsTrigger>
            <TabsTrigger value="ledger">{t("userDetail.tabs.ledger")}</TabsTrigger>
            <TabsTrigger value="usage">{t("userDetail.tabs.usage")}</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <AdminDetailSection>
              <AdminDetailMeta
                items={[
                  { label: t("userDetail.nickname"), value: user.nickname || "—" },
                  { label: t("userDetail.phone"), value: user.phone || "—" },
                  {
                    label: t("userDetail.role"),
                    value: user.role === "admin" ? t("users.roleAdmin") : t("users.roleUser"),
                  },
                  { label: t("userDetail.balance"), value: formatCredits(user.balance_fen, locale) },
                  { label: t("userDetail.frozen"), value: formatCredits(user.frozen_fen, locale) },
                  {
                    label: t("userDetail.registeredAt"),
                    value: formatDateTime(user.created_at, locale),
                    full: true,
                  },
                ]}
              />
            </AdminDetailSection>
          </TabsContent>
          <TabsContent value="orders">
            <AdminDetailTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>{t("orders.cols.orderNo")}</th>
                    <th>{t("orders.cols.amountYuan")}</th>
                    <th>{t("orders.cols.status")}</th>
                    <th>{t("orders.cols.createdAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="!text-center text-[var(--admin-muted)]">
                        {t("userDetail.noOrders")}
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td className="font-mono text-xs">{o.out_trade_no}</td>
                        <td>{formatCredits(o.amount_fen, locale)}</td>
                        <td>{t(`status.order.${o.status}`)}</td>
                        <td className="text-xs">{formatDateTime(o.created_at, locale)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </AdminDetailTableWrap>
          </TabsContent>
          <TabsContent value="ledger">
            <AdminDetailTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>{t("finance.cols.kind")}</th>
                    <th>{t("finance.cols.delta")}</th>
                    <th>{t("finance.cols.balanceAfter")}</th>
                    <th>{t("common.note")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="!text-center text-[var(--admin-muted)]">
                        {t("userDetail.noLedger")}
                      </td>
                    </tr>
                  ) : (
                    ledger.map((row) => (
                      <tr key={row.id}>
                        <td>{t(`status.ledger.${row.kind}`)}</td>
                        <td>{formatCredits(row.delta_fen, locale)}</td>
                        <td>{formatCredits(row.balance_after, locale)}</td>
                        <td className="max-w-[200px] truncate text-xs">{row.note || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </AdminDetailTableWrap>
          </TabsContent>
          <TabsContent value="usage">
            <AdminDetailTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>{t("finance.cols.date")}</th>
                    <th>{t("common.capability")}</th>
                    <th>{t("finance.charge")}</th>
                    <th>{t("finance.cost")}</th>
                    <th>{t("common.task")}</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="!text-center text-[var(--admin-muted)]">
                        {t("userDetail.noUsage")}
                      </td>
                    </tr>
                  ) : (
                    usage.map((row) => (
                      <tr key={row.id}>
                        <td className="text-xs">{formatDateTime(row.created_at, locale)}</td>
                        <td>{row.capability || "—"}</td>
                        <td>{formatCredits(row.charge_fen ?? 0, locale)}</td>
                        <td>{formatCredits(row.cost_fen ?? 0, locale)}</td>
                        <td>
                          {row.task_run_id ? (
                            <AdminEntityLink kind="task" id={row.task_run_id} />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </AdminDetailTableWrap>
          </TabsContent>
        </Tabs>
      ) : loading ? (
        <div className="py-10 text-center text-sm text-[var(--admin-muted)]">{t("common.loading")}</div>
      ) : null}
    </AdminModal>
  );
}

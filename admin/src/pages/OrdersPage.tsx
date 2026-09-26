import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type AdminLedger, type AdminOrder, type AdminUsageEventListRes, type PageMeta } from "@/api/client";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminDetailMeta, AdminDetailSection } from "@/components/admin/AdminDetailLayout";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminUserSearchSelect } from "@/components/admin/AdminUserSearchSelect";
import { PaginationBar } from "@/components/PaginationBar";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page";
import { useAdminDetailQuery } from "@/hooks/useAdminDetailQuery";
import { formatCredits } from "@/lib/utils";
import { billingBasisLabel, taskDomainLabel } from "@/lib/statusLabels";
import { useI18n, formatDateTime } from "@/i18n";

type OrderRes = { items: AdminOrder[]; meta: PageMeta };
type LedgerRes = { items: AdminLedger[]; meta: PageMeta };

const ORDER_TABS = new Set(["orders", "ledger", "usage"]);

function tabFromSearch(raw: string | null): string {
  return raw && ORDER_TABS.has(raw) ? raw : "orders";
}

function ledgerRefLink(row: AdminLedger, orderLabel?: string) {
  if (row.ref_type === "order" && row.ref_id) {
    const id = Number(row.ref_id);
    if (Number.isFinite(id) && id > 0) {
      return <AdminEntityLink kind="order" id={id} label={orderLabel ? `${orderLabel}#${id}` : undefined} />;
    }
    return (
      <Link
        to={`/orders?tab=orders&trade=${encodeURIComponent(row.ref_id)}`}
        className="admin-link font-mono text-xs"
      >
        {row.ref_id}
      </Link>
    );
  }
  if (!row.ref_type && !row.ref_id) return "—";
  return (
    <span className="font-mono text-xs">
      {row.ref_type}/{row.ref_id}
    </span>
  );
}

// 充值订单、钱包流水与用量明细
export function OrdersPage() {
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => tabFromSearch(searchParams.get("tab")));
  const [orderStatus, setOrderStatus] = useState("");
  const [orderUserId, setOrderUserId] = useState<number | null>(null);
  const [ledgerKind, setLedgerKind] = useState("");
  const [ledgerUserId, setLedgerUserId] = useState<number | null>(null);
  const [orderPage, setOrderPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [usagePage, setUsagePage] = useState(1);
  const [usageUserId, setUsageUserId] = useState<number | null>(null);
  const [usageTaskId, setUsageTaskId] = useState("");
  const [usageDomain, setUsageDomain] = useState("");
  const [usageBillingKey, setUsageBillingKey] = useState("");
  const [usageCapability, setUsageCapability] = useState("");
  const [usageBasis, setUsageBasis] = useState("");
  const [usageDateFrom, setUsageDateFrom] = useState("");
  const [usageDateTo, setUsageDateTo] = useState("");
  const [orders, setOrders] = useState<OrderRes | null>(null);
  const [ledger, setLedger] = useState<LedgerRes | null>(null);
  const [usage, setUsage] = useState<AdminUsageEventListRes | null>(null);
  const [orderDetail, setOrderDetail] = useState<AdminOrder | null>(null);
  const [ledgerDetail, setLedgerDetail] = useState<AdminLedger | null>(null);
  const orderQuery = useAdminDetailQuery("order");

  async function loadOrders(page = orderPage) {
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(DEFAULT_PAGE_SIZE) });
      if (orderStatus) params.set("status", orderStatus);
      if (orderUserId) params.set("user_id", String(orderUserId));
      setOrders(await api<OrderRes>(`/api/admin/orders?${params}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.failed"));
    }
  }

  async function loadLedger(page = ledgerPage) {
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(DEFAULT_PAGE_SIZE) });
      if (ledgerKind) params.set("kind", ledgerKind);
      if (ledgerUserId) params.set("user_id", String(ledgerUserId));
      setLedger(await api<LedgerRes>(`/api/admin/ledger?${params}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.failed"));
    }
  }

  async function loadUsage(
    page = usagePage,
    overrides?: { billing_key?: string; capability?: string },
  ) {
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(DEFAULT_PAGE_SIZE) });
      if (usageUserId) params.set("user_id", String(usageUserId));
      if (usageTaskId.trim()) params.set("task_run_id", usageTaskId.trim());
      if (usageDomain) params.set("domain", usageDomain);
      const billingKey = overrides?.billing_key ?? usageBillingKey.trim();
      const capability = overrides?.capability ?? usageCapability.trim();
      if (billingKey) params.set("billing_key", billingKey);
      if (capability) params.set("capability", capability);
      if (usageBasis) params.set("billing_basis", usageBasis);
      if (usageDateFrom) params.set("created_from", `${usageDateFrom}T00:00:00`);
      if (usageDateTo) params.set("created_to", `${usageDateTo}T23:59:59`);
      setUsage(await api<AdminUsageEventListRes>(`/api/admin/usage-events?${params}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.failed"));
    }
  }

  useEffect(() => {
    const next = tabFromSearch(searchParams.get("tab"));
    setTab((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderPage]);

  useEffect(() => {
    void loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerPage]);

  useEffect(() => {
    void loadUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usagePage]);

  useEffect(() => {
    if (!orderQuery.id || !orders?.items) return;
    const hit = orders.items.find((o) => o.id === orderQuery.id);
    if (hit) setOrderDetail(hit);
  }, [orderQuery.id, orders?.items]);

  useEffect(() => {
    const tradeNo = searchParams.get("trade");
    if (!tradeNo) return;
    void (async () => {
      try {
        const res = await api<OrderRes>(
          `/api/admin/orders?page=1&page_size=1&out_trade_no=${encodeURIComponent(tradeNo)}`,
        );
        const hit = res.items[0];
        if (hit) {
          setOrderDetail(hit);
          orderQuery.open(hit.id);
        }
      } catch {
        /* silent on failure */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function onTabChange(next: string) {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === "orders") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("common.failed"));
    }
  }

  return (
    <div className="admin-list-page">
      <PageHeader description={t("orders.description")} />
      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="orders">{t("orders.tabs.orders")}</TabsTrigger>
          <TabsTrigger value="ledger">{t("orders.tabs.ledger")}</TabsTrigger>
          <TabsTrigger value="usage">{t("orders.tabs.usage")}</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="space-y-4">
          <AdminFilterBar>
            <Select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
              <option value="">{t("orders.allStatus")}</option>
              <option value="pending">{t("status.order.pending")}</option>
              <option value="paid">{t("status.order.paid")}</option>
              <option value="closed">{t("status.order.closed")}</option>
            </Select>
            <AdminUserSearchSelect value={orderUserId} onChange={(id) => setOrderUserId(id)} />
            <Button
              size="sm"
              variant="secondary"
              className="admin-filter-action"
              onClick={() => {
                setOrderPage(1);
                void loadOrders(1);
              }}
            >
              {t("common.filter")}
            </Button>
          </AdminFilterBar>
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orders.cols.id")}</TableHead>
                  <TableHead>{t("orders.cols.merchantOrderNo")}</TableHead>
                  <TableHead>{t("orders.cols.user")}</TableHead>
                  <TableHead>{t("orders.cols.sku")}</TableHead>
                  <TableHead>{t("orders.cols.amountYuan")}</TableHead>
                  <TableHead>{t("orders.cols.creditedYuan")}</TableHead>
                  <TableHead>{t("orders.cols.payType")}</TableHead>
                  <TableHead>{t("orders.cols.status")}</TableHead>
                  <TableHead>{t("orders.cols.channelOrderNo")}</TableHead>
                  <TableHead>{t("orders.cols.paidAt")}</TableHead>
                  <TableHead>{t("orders.cols.createdAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders?.items ?? []).map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setOrderDetail(o);
                      orderQuery.open(o.id);
                    }}
                  >
                    <TableCell>{o.id}</TableCell>
                    <TableCell className="font-mono text-xs">{o.out_trade_no}</TableCell>
                    <TableCell>
                      <AdminEntityLink kind="user" id={o.user_id} label={o.user_email ?? undefined} />
                    </TableCell>
                    <TableCell>{o.sku_id}</TableCell>
                    <TableCell>{formatCredits(o.amount_fen, locale)}</TableCell>
                    <TableCell>{formatCredits(o.credit_fen, locale)}</TableCell>
                    <TableCell>{t(`status.payType.${o.pay_type}`)}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "paid" ? "success" : "secondary"}>
                        {t(`status.order.${o.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{o.trade_no || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(o.paid_at, locale)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(o.created_at, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {orders && (
            <PaginationBar
              page={orders.meta.page}
              pageSize={orders.meta.page_size}
              total={orders.meta.total}
              onPageChange={setOrderPage}
            />
          )}
        </TabsContent>
        <TabsContent value="ledger" className="space-y-4">
          <AdminFilterBar>
            <Select value={ledgerKind} onChange={(e) => setLedgerKind(e.target.value)}>
              <option value="">{t("orders.allKinds")}</option>
              <option value="topup">{t("status.ledger.topup")}</option>
              <option value="grant">{t("status.ledger.grant")}</option>
              <option value="adjust">{t("status.ledger.adjust")}</option>
              <option value="freeze">{t("status.ledger.freeze")}</option>
              <option value="unfreeze">{t("status.ledger.unfreeze")}</option>
              <option value="settle">{t("status.ledger.settle")}</option>
              <option value="refund">{t("status.ledger.refund")}</option>
            </Select>
            <AdminUserSearchSelect value={ledgerUserId} onChange={(id) => setLedgerUserId(id)} />
            <Button
              size="sm"
              variant="secondary"
              className="admin-filter-action"
              onClick={() => {
                setLedgerPage(1);
                void loadLedger(1);
              }}
            >
              {t("common.filter")}
            </Button>
          </AdminFilterBar>
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orders.cols.id")}</TableHead>
                  <TableHead>{t("orders.cols.user")}</TableHead>
                  <TableHead>{t("orders.cols.delta")}</TableHead>
                  <TableHead>{t("orders.cols.balanceAfter")}</TableHead>
                  <TableHead>{t("finance.cols.kind")}</TableHead>
                  <TableHead>{t("orders.cols.relation")}</TableHead>
                  <TableHead>{t("common.note")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ledger?.items ?? []).map((e) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setLedgerDetail(e)}>
                    <TableCell>{e.id}</TableCell>
                    <TableCell>
                      <AdminEntityLink kind="user" id={e.user_id} label={e.user_email ?? undefined} />
                    </TableCell>
                    <TableCell className={e.delta_fen >= 0 ? "text-emerald-700" : "text-red-600"}>
                      {e.delta_fen >= 0 ? "+" : ""}
                      {formatCredits(e.delta_fen, locale)}
                    </TableCell>
                    <TableCell>{formatCredits(e.balance_after, locale)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`status.ledger.${e.kind}`)}</Badge>
                    </TableCell>
                    <TableCell>{ledgerRefLink(e, t("orders.tabs.orders"))}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{e.note}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(e.created_at, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {ledger && (
            <PaginationBar
              page={ledger.meta.page}
              pageSize={ledger.meta.page_size}
              total={ledger.meta.total}
              onPageChange={setLedgerPage}
            />
          )}
        </TabsContent>
        <TabsContent value="usage" className="space-y-4">
          <AdminFilterBar>
            <AdminUserSearchSelect value={usageUserId} onChange={(id) => setUsageUserId(id)} />
            <Input placeholder={`${t("orders.cols.task")} ID`} value={usageTaskId} onChange={(e) => setUsageTaskId(e.target.value)} />
            <Select value={usageDomain} onChange={(e) => setUsageDomain(e.target.value)}>
              <option value="">{t("orders.allDomains")}</option>
              <option value="kepu">{t("nav.items.projects")}</option>
              <option value="drama">{t("nav.groups.drama")}</option>
              <option value="studio">Studio</option>
              <option value="api">API</option>
            </Select>
            <Input
              placeholder="billing_key"
              value={usageBillingKey}
              onChange={(e) => setUsageBillingKey(e.target.value)}
            />
            <Select value={usageCapability} onChange={(e) => setUsageCapability(e.target.value)}>
              <option value="">{t("orders.allCapabilities")}</option>
              <option value="llm">LLM</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="tts">TTS</option>
            </Select>
            <Select value={usageBasis} onChange={(e) => setUsageBasis(e.target.value)}>
              <option value="">{t("orders.allBillingBases")}</option>
              <option value="estimate">{t("orders.estimate")}</option>
              <option value="upstream">{t("orders.actual")}</option>
              <option value="upstream_usage">{t("orders.actual")} (Token)</option>
              <option value="upstream_cost">{t("orders.actual")} (Cost)</option>
            </Select>
            <AdminDateRangeFilter
              from={usageDateFrom}
              to={usageDateTo}
              onChange={({ from, to }) => {
                setUsageDateFrom(from);
                setUsageDateTo(to);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="admin-filter-action"
              onClick={() => {
                setUsageBillingKey("llm_chat");
                setUsageCapability("llm");
                setUsagePage(1);
                void loadUsage(1, { billing_key: "llm_chat", capability: "llm" });
              }}
            >
              {t("orders.llmUsage")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="admin-filter-action"
              onClick={() => {
                setUsagePage(1);
                void loadUsage(1);
              }}
            >
              {t("common.filter")}
            </Button>
          </AdminFilterBar>
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("orders.cols.user")}</TableHead>
                  <TableHead>{t("orders.cols.task")}</TableHead>
                  <TableHead>{t("orders.cols.project")}</TableHead>
                  <TableHead>{t("orders.cols.domain")}</TableHead>
                  <TableHead>{t("common.capability")}</TableHead>
                  <TableHead>{t("orders.cols.model")}</TableHead>
                  <TableHead>{t("orders.cols.tokens")}</TableHead>
                  <TableHead>{t("finance.charge")}</TableHead>
                  <TableHead>{t("orders.cols.upstreamCost")}</TableHead>
                  <TableHead>{t("orders.cols.billingBasis")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usage?.items ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(row.created_at, locale)}
                    </TableCell>
                    <TableCell>
                      <AdminEntityLink kind="user" id={row.user_id} label={row.user_email ?? undefined} />
                    </TableCell>
                    <TableCell>
                      {row.task_run_id ? (
                        <AdminEntityLink kind="task" id={row.task_run_id} />
                      ) : (
                        t("orders.unlinked")
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.project_id ? (
                        <AdminEntityLink kind="project" id={row.project_id} />
                      ) : row.drama_project_id ? (
                        <AdminEntityLink kind="drama" id={row.drama_project_id} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{row.domain ? taskDomainLabel(row.domain, t) : "—"}</TableCell>
                    <TableCell>{row.capability ?? row.billing_key}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs">{row.model || "—"}</TableCell>
                    <TableCell>{row.total_tokens ?? 0}</TableCell>
                    <TableCell>{formatCredits(row.charge_fen ?? 0, locale)}</TableCell>
                    <TableCell>{formatCredits(row.cost_fen ?? 0, locale)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.billing_basis === "estimate" || row.estimated
                            ? "secondary"
                            : "success"
                        }
                      >
                        {billingBasisLabel(row.billing_basis, row.estimated, t)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {usage && (
            <PaginationBar
              page={usage.meta.page}
              pageSize={usage.meta.page_size}
              total={usage.meta.total}
              onPageChange={setUsagePage}
            />
          )}
        </TabsContent>
      </Tabs>

      <AdminModal
        open={orderQuery.isOpen && !!orderDetail}
        onOpenChange={(open) => {
          if (!open) {
            setOrderDetail(null);
            orderQuery.close();
          }
        }}
        size="md"
        title={orderDetail ? `${t("orders.detailTitle")} #${orderDetail.id}` : t("orders.detailTitle")}
        subtitle={orderDetail?.out_trade_no}
        footer={
          orderDetail ? (
            <Button size="sm" variant="outline" onClick={() => void copyText(orderDetail.out_trade_no)}>
              {t("orders.copyOrderNo")}
            </Button>
          ) : undefined
        }
      >
        {orderDetail ? (
          <AdminDetailSection>
            <AdminDetailMeta
              items={[
                {
                  label: t("orders.cols.user"),
                  value: (
                    <AdminEntityLink
                      kind="user"
                      id={orderDetail.user_id}
                      label={orderDetail.user_email ?? undefined}
                    />
                  ),
                },
                { label: t("orders.cols.sku"), value: orderDetail.sku_id },
                { label: t("orders.cols.amountYuan"), value: formatCredits(orderDetail.amount_fen, locale) },
                { label: t("orders.cols.creditedYuan"), value: formatCredits(orderDetail.credit_fen, locale) },
                { label: t("orders.cols.payType"), value: t(`status.payType.${orderDetail.pay_type}`) },
                { label: t("orders.cols.status"), value: t(`status.order.${orderDetail.status}`) },
                { label: t("orders.cols.channelOrderNo"), value: orderDetail.trade_no || "—" },
                {
                  label: t("orders.cols.paidAt"),
                  value: formatDateTime(orderDetail.paid_at, locale),
                },
                {
                  label: t("orders.cols.createdAt"),
                  value: formatDateTime(orderDetail.created_at, locale),
                  full: true,
                },
              ]}
            />
          </AdminDetailSection>
        ) : null}
      </AdminModal>

      <AdminModal
        open={!!ledgerDetail}
        onOpenChange={(open) => !open && setLedgerDetail(null)}
        size="md"
        title={ledgerDetail ? `${t("orders.ledgerTitle")} #${ledgerDetail.id}` : t("orders.ledgerTitle")}
      >
        {ledgerDetail ? (
          <AdminDetailSection>
            <AdminDetailMeta
              items={[
                {
                  label: t("orders.cols.user"),
                  value: (
                    <AdminEntityLink
                      kind="user"
                      id={ledgerDetail.user_id}
                      label={ledgerDetail.user_email ?? undefined}
                    />
                  ),
                },
                { label: t("finance.cols.kind"), value: t(`status.ledger.${ledgerDetail.kind}`) },
                { label: t("orders.cols.delta"), value: formatCredits(ledgerDetail.delta_fen, locale) },
                { label: t("orders.cols.balanceAfter"), value: formatCredits(ledgerDetail.balance_after, locale) },
                { label: t("orders.cols.relation"), value: ledgerRefLink(ledgerDetail, t("orders.tabs.orders")) },
                { label: t("common.note"), value: ledgerDetail.note || "—" },
                {
                  label: t("common.date"),
                  value: formatDateTime(ledgerDetail.created_at, locale),
                  full: true,
                },
              ]}
            />
          </AdminDetailSection>
        ) : null}
      </AdminModal>
    </div>
  );
}

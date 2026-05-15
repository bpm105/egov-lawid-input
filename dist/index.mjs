import { jsxs as r, jsx as o, Fragment as ie } from "react/jsx-runtime";
import { useState as c, useRef as $, useEffect as U, useCallback as oe } from "react";
const Z = "https://laws.e-gov.go.jp/api/2";
async function re(a, m = 10, u = Z, s) {
  const n = a.trim();
  if (!n) return [];
  const f = `${u}/laws?law_title=${encodeURIComponent(n)}&limit=50`;
  try {
    const d = await fetch(f);
    if (!d.ok) return [];
    const p = await d.json(), w = (Array.isArray(p) ? p : p.laws ?? []).map((l) => ({
      lawId: l.law_info?.law_id,
      lawTitle: l.revision_info?.law_title,
      lawNum: l.law_info?.law_num,
      isRepealed: l.revision_info?.repeal_status === "Repeal"
    }));
    return w.sort((l, g) => {
      const N = l.lawTitle === n ? 0 : l.lawTitle.startsWith(n) ? 1 : 2, k = g.lawTitle === n ? 0 : g.lawTitle.startsWith(n) ? 1 : 2;
      return N - k;
    }), w.slice(0, m);
  } catch (d) {
    return s?.(d), [];
  }
}
async function ce(a, m = Z, u) {
  try {
    const s = await fetch(`${m}/law_revisions/${a}`);
    return s.ok ? ((await s.json()).revisions ?? []).length : void 0;
  } catch (s) {
    u?.(s);
    return;
  }
}
const F = (a) => /^[A-Za-z0-9]+$/.test(a.trim()), _ = (...a) => a.filter(Boolean).join(" ");
function de({
  onSelect: a,
  onSubmit: m,
  onReset: u,
  onError: s,
  initialValue: n = "",
  loading: f = !1,
  submitLabel: d = "決定",
  submitLoadingLabel: p = "取得中",
  hideSubmitButton: M = !1,
  showRevisionBadge: w = !1,
  showRepealedBadge: l = !0,
  debounceMs: g = 300,
  searchLimit: N = 10,
  placeholder: k = "法令IDまたは法令名（例: 民法）",
  searchingText: P = "検索中…",
  noResultsText: H = "キーワードにマッチする法令名がありません",
  className: J,
  inputClassName: O,
  submitButtonClassName: Q,
  dropdownClassName: X,
  itemClassName: Y,
  apiBaseUrl: R
}) {
  const [D, y] = c(n), [K, A] = c(!!n), [h, v] = c([]), [W, i] = c(!1), [C, I] = c(-1), [T, z] = c(!1), [q, S] = c(!1), j = $(void 0), x = $(0), E = $(null);
  U(() => {
    y(n), A(!!n);
  }, [n]), U(() => {
    const e = (t) => {
      E.current && !E.current.contains(t.target) && i(!1);
    };
    return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
  }, []);
  const B = oe(async (e) => {
    if (!e.trim() || F(e)) {
      v([]), i(!1), S(!1);
      return;
    }
    const t = ++x.current;
    z(!0), S(!1), v([]), i(!1);
    const b = await re(e, N, R, s);
    if (t === x.current && (z(!1), v(b), S(b.length === 0), i(!0), I(-1), w && b.length > 0)) {
      const se = await Promise.all(
        b.map((L) => ce(L.lawId, R, s))
      );
      if (t !== x.current) return;
      v((L) => L.map((ae, le) => ({ ...ae, revisionCount: se[le] })));
    }
  }, [N, R, s, w]), V = (e) => {
    y(e), K && (A(!1), u?.()), i(!1), S(!1), j.current && clearTimeout(j.current), j.current = setTimeout(() => B(e), g);
  }, ee = () => {
    K && (u?.(), y(""), A(!1)), h.length > 0 && i(!0);
  }, G = (e) => {
    y(e.lawId), v([]), i(!1), a?.(e);
  }, te = (e) => {
    e.preventDefault(), i(!1);
    const t = D.trim();
    t && F(t) && m?.(t);
  }, ne = (e) => {
    !W || h.length === 0 || (e.key === "ArrowDown" ? (e.preventDefault(), I((t) => Math.min(t + 1, h.length - 1))) : e.key === "ArrowUp" ? (e.preventDefault(), I((t) => Math.max(t - 1, 0))) : e.key === "Enter" && C >= 0 ? (e.preventDefault(), G(h[C])) : e.key === "Escape" && i(!1));
  };
  return /* @__PURE__ */ r("div", { ref: E, className: _("egov-law-input", J), children: [
    /* @__PURE__ */ r("form", { className: "egov-law-input__form", onSubmit: te, children: [
      /* @__PURE__ */ o(
        "input",
        {
          className: _("egov-law-input__input", O),
          type: "text",
          value: D,
          onChange: (e) => V(e.target.value),
          onFocus: ee,
          onKeyDown: ne,
          placeholder: k,
          disabled: f
        }
      ),
      !M && /* @__PURE__ */ o(
        "button",
        {
          type: "submit",
          className: _("egov-law-input__submit", Q),
          disabled: f || !F(D),
          children: f || T ? /* @__PURE__ */ r(ie, { children: [
            /* @__PURE__ */ o("span", { className: "egov-law-input__spinner" }),
            f ? p : P
          ] }) : d
        }
      )
    ] }),
    W && /* @__PURE__ */ r("div", { className: _("egov-law-input__dropdown", X), children: [
      T && /* @__PURE__ */ o("div", { className: "egov-law-input__empty", children: P }),
      !T && q && /* @__PURE__ */ o("div", { className: "egov-law-input__empty", children: H }),
      h.map((e, t) => /* @__PURE__ */ r(
        "div",
        {
          onClick: () => G(e),
          onMouseEnter: () => I(t),
          className: _(
            "egov-law-input__item",
            t === C && "egov-law-input__item--active",
            Y
          ),
          children: [
            /* @__PURE__ */ r("div", { className: "egov-law-input__item-title", children: [
              e.lawTitle,
              l && e.isRepealed && /* @__PURE__ */ o("span", { className: "egov-law-input__badge", children: "廃止" }),
              w && e.revisionCount === 1 && /* @__PURE__ */ o("span", { className: "egov-law-input__badge", children: "単一施行日" })
            ] }),
            /* @__PURE__ */ r("div", { className: "egov-law-input__item-meta", children: [
              e.lawNum,
              /* @__PURE__ */ o("span", { className: "egov-law-input__item-id", children: e.lawId })
            ] })
          ]
        },
        e.lawId
      ))
    ] })
  ] });
}
export {
  de as LawIdInput,
  ce as fetchRevisionCount,
  re as searchLaws
};
//# sourceMappingURL=index.mjs.map

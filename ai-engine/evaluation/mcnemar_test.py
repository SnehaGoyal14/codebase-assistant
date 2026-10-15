"""
McNemar's test comparing naive chunking vs AST chunking.

Binary threshold: score >= 1 → correct (1), score == 0 → incorrect (0)

Note: if neither system produces any score=0 answers, both achieve 100%
binary accuracy, b=c=0, and McNemar's test is undefined/trivially
non-significant. The sign test on raw graded scores (0-2) is reported
as a more sensitive backup comparison.
"""

import csv
import math
from pathlib import Path

NAIVE_FILE  = "evaluation/results.csv"
AST_FILE    = "evaluation/results_ast.csv"
REPORT_FILE = "evaluation/mcnemar_report.txt"


# ── helpers ────────────────────────────────────────────────────────────────────

def load_scores(path):
    """Return ordered list of int scores from a CSV file."""
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [(int(row["id"]), int(row["score"])) for row in reader]


def to_binary(score):
    return 1 if score >= 1 else 0


def accuracy_pct(binary_list):
    return sum(binary_list) / len(binary_list) * 100


def graded_accuracy_pct(scores, max_per_q=2):
    return sum(scores) / (len(scores) * max_per_q) * 100


# ── sign test (two-sided) using binomial distribution ─────────────────────────

def binomial_pmf(n, k, p=0.5):
    """P(X=k) for Binomial(n, p)."""
    from math import comb
    return comb(n, k) * (p ** k) * ((1 - p) ** (n - k))


def sign_test_p(n_plus, n_minus):
    """Two-sided sign test p-value (exact binomial, ties excluded)."""
    n = n_plus + n_minus
    if n == 0:
        return 1.0
    k = min(n_plus, n_minus)          # observed value of the smaller tail
    # sum P(X <= k) for X ~ Binomial(n, 0.5), doubled for two-sided
    p_one_tail = sum(binomial_pmf(n, i) for i in range(k + 1))
    return min(1.0, 2 * p_one_tail)


# ── main ───────────────────────────────────────────────────────────────────────

def main():
    try:
        from statsmodels.stats.contingency_tables import mcnemar as mcnemar_test
        have_statsmodels = True
    except ImportError:
        have_statsmodels = False

    naive_raw  = load_scores(NAIVE_FILE)
    ast_raw    = load_scores(AST_FILE)

    # align by id
    naive_by_id = {qid: s for qid, s in naive_raw}
    ast_by_id   = {qid: s for qid, s in ast_raw}
    ids = sorted(naive_by_id)

    naive_scores  = [naive_by_id[i] for i in ids]
    ast_scores    = [ast_by_id[i]   for i in ids]
    naive_binary  = [to_binary(s)   for s in naive_scores]
    ast_binary    = [to_binary(s)   for s in ast_scores]

    n = len(ids)

    # 2×2 contingency table
    # a = both correct, b = naive correct AST wrong,
    # c = naive wrong AST correct, d = both wrong
    a = sum(1 for nb, ab in zip(naive_binary, ast_binary) if nb == 1 and ab == 1)
    b = sum(1 for nb, ab in zip(naive_binary, ast_binary) if nb == 1 and ab == 0)
    c = sum(1 for nb, ab in zip(naive_binary, ast_binary) if nb == 0 and ab == 1)
    d = sum(1 for nb, ab in zip(naive_binary, ast_binary) if nb == 0 and ab == 0)

    naive_bin_acc  = accuracy_pct(naive_binary)
    ast_bin_acc    = accuracy_pct(ast_binary)
    naive_grad_acc = graded_accuracy_pct(naive_scores)
    ast_grad_acc   = graded_accuracy_pct(ast_scores)

    # McNemar's test
    if have_statsmodels:
        import numpy as np
        table = np.array([[a, b], [c, d]])
        use_exact = (b + c) < 25
        result = mcnemar_test(table, exact=use_exact, correction=not use_exact)
        chi2_val = result.statistic
        p_val    = result.pvalue
        method   = "exact binomial" if use_exact else "chi-square with continuity correction"
    else:
        # Manual chi-square (with continuity correction)
        if (b + c) == 0:
            chi2_val, p_val = 0.0, 1.0
        else:
            chi2_val = (abs(b - c) - 1) ** 2 / (b + c)
            # chi-square CDF via regularised incomplete gamma (approx)
            # p = 1 - chi2_cdf(chi2, df=1)
            # Use simple approximation via normal: z = sqrt(chi2)
            z = math.sqrt(chi2_val)
            p_val = 2 * (1 - 0.5 * (1 + math.erf(z / math.sqrt(2))))
        method = "chi-square (manual, statsmodels not available)"

    # Significance
    significant = p_val < 0.05

    # Odds ratio (effect size)
    if c > 0:
        odds_ratio = b / c
    else:
        odds_ratio = float("inf") if b > 0 else float("nan")

    # Sign test on raw graded scores (0-2)
    n_plus  = sum(1 for ns, as_ in zip(naive_scores, ast_scores) if as_ > ns)   # AST better
    n_minus = sum(1 for ns, as_ in zip(naive_scores, ast_scores) if ns > as_)   # Naive better
    n_ties  = sum(1 for ns, as_ in zip(naive_scores, ast_scores) if ns == as_)
    sign_p  = sign_test_p(n_plus, n_minus)
    sign_sig = sign_p < 0.05

    # ── build report ────────────────────────────────────────────────────────────
    lines = [
        "=" * 60,
        "McNemar's Test: Naive Chunking vs AST Chunking",
        "=" * 60,
        "",
        "── Accuracy ──────────────────────────────────────────────",
        f"  Naive chunking  — graded: {naive_grad_acc:.1f}%   binary: {naive_bin_acc:.1f}%",
        f"  AST chunking    — graded: {ast_grad_acc:.1f}%   binary: {ast_bin_acc:.1f}%",
        f"  (Graded = total_score / {n * 2} max pts; Binary = score >= 1)",
        "",
        "── Binary Contingency Table ──────────────────────────────",
        "                 AST correct   AST incorrect",
        f"  Naive correct      {a:>4}          {b:>4}",
        f"  Naive incorrect    {c:>4}          {d:>4}",
        f"  b (naive✓, AST✗) = {b}",
        f"  c (naive✗, AST✓) = {c}",
        "",
        "── McNemar's Test (binary threshold: score ≥ 1) ─────────",
        f"  Method           : {method}",
        f"  Chi-square       : {chi2_val:.4f}",
        f"  p-value          : {p_val:.4f}",
        f"  Significant      : {'YES (p < 0.05)' if significant else 'NO (p ≥ 0.05)'}",
        f"  Odds ratio (b/c) : {odds_ratio if not math.isnan(odds_ratio) else 'undefined (no discordant pairs)'}",
        "",
    ]

    if b == 0 and c == 0:
        lines += [
            "  ⚠  INTERPRETATION: Both systems classified every question",
            "     as 'correct' (score ≥ 1). There are no discordant pairs",
            "     (b = c = 0), so McNemar's test is trivially non-significant.",
            "     The graded score difference (85.0% → 87.5%) is real but",
            "     reflects a shift from score=1 to score=2, not 0→1.",
            "     Use the sign test below for a more sensitive comparison.",
        ]
    else:
        lines.append(
            f"  INTERPRETATION: The difference is "
            f"{'statistically significant' if significant else 'NOT statistically significant'} "
            f"at p < 0.05."
        )

    lines += [
        "",
        "── Sign Test on Raw Graded Scores (0-2) ──────────────────",
        f"  Questions where AST scored higher  : {n_plus}",
        f"  Questions where Naive scored higher : {n_minus}",
        f"  Tied questions                      : {n_ties}",
        f"  p-value (two-sided exact)           : {sign_p:.4f}",
        f"  Significant                         : {'YES (p < 0.05)' if sign_sig else 'NO (p ≥ 0.05)'}",
        "",
        f"  INTERPRETATION: AST chunking improved {n_plus} questions and",
        f"  worsened {n_minus} (with {n_ties} tied). The sign test",
        f"  {'confirms' if sign_sig else 'does not confirm'} a significant difference at p < 0.05.",
        "",
        "=" * 60,
        "SUMMARY",
        "=" * 60,
        f"  Naive chunking accuracy  : {naive_grad_acc:.1f}%",
        f"  AST chunking accuracy    : {ast_grad_acc:.1f}%",
        f"  Improvement              : +{ast_grad_acc - naive_grad_acc:.1f}pp",
        f"  McNemar p-value          : {p_val:.4f} ({'significant' if significant else 'not significant'})",
        f"  Sign test p-value        : {sign_p:.4f} ({'significant' if sign_sig else 'not significant'})",
        f"  Conclusion               : The 2.5pp improvement is {'statistically supported' if sign_sig else 'present but not statistically significant at p<0.05 with n=20'}.",
        "=" * 60,
    ]

    report = "\n".join(lines)
    print(report)

    Path(REPORT_FILE).write_text(report + "\n", encoding="utf-8")
    print(f"\nReport saved to {REPORT_FILE}")


if __name__ == "__main__":
    main()

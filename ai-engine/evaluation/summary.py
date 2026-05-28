import csv

def get_accuracy(filepath):
    total_score = 0
    max_score = 0
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_score += int(row["score"])
                max_score += 2
    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return 0
    if max_score == 0:
        return 0
    return (total_score / max_score) * 100

# Baseline hardcoded — scored manually without GPT
# Score 2: 3/20, Score 1: 11/20, Score 0: 6/20
baseline = 42.5

gpt_naive = 85.0
gpt_ast = get_accuracy("evaluation/results_ast.csv")
phase2_ast = get_accuracy("evaluation/results_hard_ast.csv")

gpt_improvement = gpt_naive - baseline
ast_improvement = gpt_ast - gpt_naive
phase2_drop = phase2_ast - gpt_ast

print("=" * 45)
print("         PAPER 1 — EVALUATION SUMMARY")
print("=" * 45)
print(f"Baseline accuracy (no GPT):       {baseline:.1f}%")
print(f"GPT-4o mini + naive chunking:     {gpt_naive:.1f}%")
print(f"GPT-4o mini + AST chunking:       {gpt_ast:.1f}%")
print(f"Phase 2 hard questions (AST):     {phase2_ast:.1f}%")
print("-" * 45)
print(f"GPT improvement over baseline:    +{gpt_improvement:.1f}%")
print(f"AST improvement over naive:       +{ast_improvement:.1f}%")
print(f"Phase 2 vs Phase 1:               {phase2_drop:.1f}%")
print("-" * 45)
print(f"Chunk reduction (Tree-sitter):    61.67%")
print(f"Hallucination rate (Phase 2):     30.0%")
print(f"Total repos tested:               5")
print(f"Total evaluation cost:            <$2")
print("=" * 45)

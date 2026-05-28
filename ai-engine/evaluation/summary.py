import csv

def get_accuracy(filepath):
    total = 0
    correct = 0
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total += 1
                if int(row["score"]) >= 1:
                    correct += 1
    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return 0
    if total == 0:
        return 0
    return (correct / total) * 100

# Read all CSV files
baseline = get_accuracy("evaluation/results.csv")
gpt_ast = get_accuracy("evaluation/results_ast.csv")
phase2 = get_accuracy("evaluation/results_hard.csv")
phase2_ast = get_accuracy("evaluation/results_hard_ast.csv")

# Calculate improvements
gpt_improvement = gpt_ast - baseline
ast_vs_phase2 = phase2_ast - phase2
phase2_drop = phase2 - baseline

# Print summary
print("=" * 40)
print("        EVALUATION SUMMARY")
print("=" * 40)
print(f"Baseline accuracy:            {baseline:.1f}%")
print(f"GPT + AST:                    {gpt_ast:.1f}%")
print(f"Phase 2 hard questions:       {phase2:.1f}%")
print(f"Phase 2 hard + AST:           {phase2_ast:.1f}%")
print("-" * 40)
print(f"GPT improvement over baseline: +{gpt_improvement:.1f}%")
print(f"AST improvement (hard):        +{ast_vs_phase2:.1f}%")
print(f"Phase 2 drop from Phase 1:    {phase2_drop:.1f}%")
print("=" * 40)
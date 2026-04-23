import os
import ast

def extract_imports(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            tree = ast.parse(f.read())
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module)
        return imports
    except Exception:
        return []

def build_graph(repo_path):
    nodes = []
    edges = []
    file_index = set()
    skip_folders = ['node_modules', '.git', 'venv', '__pycache__']

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in skip_folders]
        for file in files:
            if file.endswith('.py'):
                full_path = os.path.join(root, file)
                relative = full_path.replace(repo_path, '')
                file_index.add(relative)
                nodes.append({
                    "id": relative,
                    "name": file,
                    "path": relative
                })

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in skip_folders]
        for file in files:
            if file.endswith('.py'):
                full_path = os.path.join(root, file)
                relative = full_path.replace(repo_path, '')
                imports = extract_imports(full_path)
                for imp in imports:
                    imp_path = '/' + imp.replace('.', '/') + '.py'
                    imp_filename = imp.split('.')[-1] + '.py'
                    matched_target = None
                    for f in file_index:
                        if f == imp_path or f.endswith('/' + imp_filename):
                           matched_target = f
                           break
                    if matched_target:
                       edges.append({
                           "source": relative,
                           "target": matched_target
                        })

    return {
        "nodes": nodes,
        "edges": edges,
        "total_files": len(nodes),
        "total_connections": len(edges)
    }

import os
import re

SKIP_DIRS = {
    'node_modules', '.git', 'venv', '__pycache__', 'target',
    'dist', 'build', '.next', '.tox', 'vendor', '.mypy_cache',
    '.pytest_cache', 'coverage', '.nyc_output',
}

EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx',
    '.java', '.c', '.cpp', '.h', '.hpp',
    '.go', '.rb', '.rs',
}


def get_language(filename):
    ext = os.path.splitext(filename)[1].lower()
    mapping = {
        '.py': 'python',
        '.js': 'javascript', '.jsx': 'javascript',
        '.ts': 'javascript', '.tsx': 'javascript',
        '.java': 'java',
        '.c': 'c', '.cpp': 'c', '.h': 'c', '.hpp': 'c',
        '.go': 'go',
        '.rb': 'ruby',
        '.rs': 'rust',
    }
    return mapping.get(ext)


def extract_imports(file_path, language):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return []

    imports = []

    if language == 'python':
        for m in re.finditer(r'^\s*import\s+([\w.]+)', content, re.MULTILINE):
            imports.append(('module', m.group(1)))
        for m in re.finditer(r'^\s*from\s+([\w.]+)\s+import', content, re.MULTILINE):
            imports.append(('module', m.group(1)))

    elif language == 'javascript':
        # import ... from 'path'
        for m in re.finditer(r'import\s+.*?from\s+[\'"]([^\'"]+)[\'"]', content, re.DOTALL):
            imports.append(('path', m.group(1)))
        # import 'path' (side-effect)
        for m in re.finditer(r'import\s+[\'"]([^\'"]+)[\'"]', content):
            imports.append(('path', m.group(1)))
        # require('path')
        for m in re.finditer(r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)', content):
            imports.append(('path', m.group(1)))

    elif language == 'java':
        for m in re.finditer(r'^\s*import\s+([\w.]+);', content, re.MULTILINE):
            imports.append(('java', m.group(1)))

    elif language == 'c':
        # Only local includes with double quotes, not <system>
        for m in re.finditer(r'#include\s+"([^"]+)"', content):
            imports.append(('relative', m.group(1)))

    elif language == 'go':
        # Single: import "path"
        for m in re.finditer(r'import\s+"([^"]+)"', content):
            imports.append(('go', m.group(1)))
        # Multi-line: import ( "path1" "path2" )
        block = re.search(r'import\s*\(([^)]+)\)', content, re.DOTALL)
        if block:
            for m in re.finditer(r'"([^"]+)"', block.group(1)):
                imports.append(('go', m.group(1)))

    elif language == 'ruby':
        for m in re.finditer(r'require_relative\s+[\'"]([^\'"]+)[\'"]', content):
            imports.append(('relative', m.group(1)))
        for m in re.finditer(r'\brequire\s+[\'"]([^\'"]+)[\'"]', content):
            imports.append(('module', m.group(1)))

    elif language == 'rust':
        for m in re.finditer(r'^\s*use\s+([\w:]+)', content, re.MULTILINE):
            imports.append(('rust', m.group(1)))
        for m in re.finditer(r'^\s*mod\s+(\w+)\s*;', content, re.MULTILINE):
            imports.append(('rust_mod', m.group(1)))

    return imports


def resolve_import(imp_type, imp_value, source_dir, file_index):
    # source_dir is a relative dir string without leading slash (may be empty)

    def norm(p):
        # Normalise to /path/to/file with forward slashes
        return '/' + os.path.normpath(p).replace(os.sep, '/').lstrip('/')

    if imp_type == 'module':  # Python or Ruby require
        parts = imp_value.replace('.', '/')
        candidates = [
            norm(parts + '.py'),
            norm(parts + '/__init__.py'),
            norm(parts + '.rb'),
        ]
        # Also try relative to source dir
        if source_dir:
            candidates += [
                norm(os.path.join(source_dir, parts + '.py')),
                norm(os.path.join(source_dir, parts + '/__init__.py')),
                norm(os.path.join(source_dir, parts + '.rb')),
            ]
        for c in candidates:
            if c in file_index:
                return c
        return None

    elif imp_type == 'path':  # JS/TS — only resolve relative paths
        if not imp_value.startswith('.'):
            return None
        base = norm(os.path.join(source_dir or '.', imp_value))
        js_exts = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
        candidates = [base]
        for ext in js_exts:
            candidates.append(base + ext)
        for ext in js_exts:
            candidates.append(norm(base + '/index' + ext))
        for c in candidates:
            if c in file_index:
                return c
        return None

    elif imp_type == 'java':
        path = imp_value.replace('.', '/') + '.java'
        target = norm(path)
        if target in file_index:
            return target
        for f in file_index:
            if f.endswith('/' + path):
                return f
        return None

    elif imp_type == 'relative':  # C includes or Ruby require_relative
        base = norm(os.path.join(source_dir or '.', imp_value))
        if base in file_index:
            return base
        for ext in ('.rb', '.h', '.hpp', '.c', '.cpp'):
            t = base + ext
            if t in file_index:
                return t
        return None

    elif imp_type == 'go':
        # Match trailing path segments against repo file paths
        parts = imp_value.strip('/').split('/')
        for length in range(len(parts), 0, -1):
            suffix = '/'.join(parts[-length:])
            for f in file_index:
                if ('/' + suffix + '/') in (f + '/'):
                    return f
        return None

    elif imp_type == 'rust':
        segments = imp_value.split('::')
        if segments and segments[0] in ('crate', 'super', 'self'):
            segments = segments[1:]
        if not segments:
            return None
        path = '/'.join(segments)
        for candidate in (norm(path + '.rs'), norm(path + '/mod.rs')):
            if candidate in file_index:
                return candidate
        for f in file_index:
            if f.endswith('/' + path + '.rs') or f.endswith('/' + path + '/mod.rs'):
                return f
        return None

    elif imp_type == 'rust_mod':
        base = source_dir or '.'
        for candidate in (
            norm(os.path.join(base, imp_value + '.rs')),
            norm(os.path.join(base, imp_value, 'mod.rs')),
        ):
            if candidate in file_index:
                return candidate
        return None

    return None


def build_graph(repo_path):
    nodes = []
    edges = []
    file_index = set()
    file_map = {}

    repo_path = os.path.abspath(repo_path)

    # Collect all supported files
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for filename in files:
            if os.path.splitext(filename)[1].lower() not in EXTENSIONS:
                continue
            full_path = os.path.join(root, filename)
            relative = '/' + os.path.relpath(full_path, repo_path).replace(os.sep, '/')
            file_index.add(relative)
            file_map[relative] = full_path
            nodes.append({'id': relative, 'name': filename, 'path': relative})

    # Extract imports and resolve to edges
    seen_edges = set()
    for relative, full_path in file_map.items():
        language = get_language(os.path.basename(relative))
        if not language:
            continue
        raw_imports = extract_imports(full_path, language)
        source_dir = relative.rsplit('/', 1)[0].lstrip('/')
        for imp_type, imp_value in raw_imports:
            target = resolve_import(imp_type, imp_value, source_dir, file_index)
            if target and target != relative and target in file_index:
                key = (relative, target)
                if key not in seen_edges:
                    seen_edges.add(key)
                    edges.append({'source': relative, 'target': target})

    return {
        'nodes': nodes,
        'edges': edges,
        'total_files': len(nodes),
        'total_connections': len(edges),
    }

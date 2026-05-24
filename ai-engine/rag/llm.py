from openai import OpenAI

def get_answer(question, chunks, api_key):
    client = OpenAI(api_key=api_key)
    
    chunks_text = "\n\n---\n\n".join(chunks)
    
    prompt = f"""You are an expert code analyst helping a developer understand an unfamiliar codebase.

You will be given code snippets from a repository. Your job is to answer the question as specifically as possible.

Important rules:
- Always mention specific file names, function names, and class names from the snippets
- If asked WHERE something is implemented, give the exact file path and function name
- If asked HOW something works, explain the specific implementation shown in the code
- If asked WHAT something does, describe its exact behavior based on the code
- Never give generic answers — always reference the actual code shown

Code snippets:
{chunks_text}

Question: {question}

Respond in exactly this format and nothing else:

EXPLANATION:
<your detailed text explanation here>

DIAGRAM:
<a valid Mermaid diagram using graph LR syntax that visually shows the concept or flow described in your explanation. Keep it simple — maximum 8 nodes.>"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800
    )
    
    raw = response.choices[0].message.content

    # Parse explanation and diagram
    explanation = ""
    diagram = ""

    if "EXPLANATION:" in raw and "DIAGRAM:" in raw:
        parts = raw.split("DIAGRAM:")
        explanation = parts[0].replace("EXPLANATION:", "").strip()
        diagram = parts[1].strip()
    else:
        explanation = raw
        diagram = ""

    return explanation, diagram
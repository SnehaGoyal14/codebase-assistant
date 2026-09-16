from openai import OpenAI

def get_answer(question, chunks, api_key):
    client = OpenAI(api_key=api_key)
    
    chunks_text = "\n\n---\n\n".join(chunks)
    
    prompt = f"""You are an expert code analyst helping a developer understand an unfamiliar codebase.

You will be given code snippets from a repository. Answer the question in a clear, structured, developer-friendly way.

Important rules:
- Use short paragraphs or bullet points — never write one long paragraph
- Use **bold** for key terms, file names, function names, and class names
- If explaining a flow or process, use numbered steps
- Be concise — get to the point quickly
- Always reference specific files and functions from the code snippets
- Never give generic answers

Code snippets:
{chunks_text}

Question: {question}

Respond in exactly this format and nothing else:

EXPLANATION:
<your answer here — use bullet points, numbered steps, or short paragraphs with **bold** for key terms>

DIAGRAM:
<a valid Mermaid diagram using graph LR syntax that visually shows the concept or flow. Maximum 8 nodes. Keep it simple.>"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800
    )
    
    raw = response.choices[0].message.content

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

from openai import OpenAI

def get_answer(question, chunks, api_key):
    client = OpenAI(api_key=api_key)
    
    chunks_text = "\n\n---\n\n".join(chunks)
    
    prompt = f"""You are a code assistant helping a developer understand an unfamiliar codebase.

You will be given code snippets from a repository. Explain what the code does to answer the question.
Base your answer on the code snippets provided. If the snippets show relevant code, explain it clearly.
Only say you cannot find the answer if the snippets are completely unrelated to the question.

Code snippets:
{chunks_text}

Question: {question}

Answer (explain what the code shows):"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500
    )
    
    return response.choices[0].message.content

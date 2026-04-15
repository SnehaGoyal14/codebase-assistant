from openai import OpenAI

def get_answer(question, chunks, api_key):
    client = OpenAI(api_key=api_key)
    
    chunks_text = "\n\n---\n\n".join(chunks)
    
    prompt = f"""You are a code assistant helping a developer understand an unfamiliar codebase.

CRITICAL INSTRUCTIONS:
1. Answer ONLY using the code snippets provided below
2. If the answer is not in the snippets say: "I could not find this in the provided code"
3. Never make anything up
4. Keep your answer clear and concise
5. Mention which file the answer came from

Code snippets:
{chunks_text}

Question: {question}

Answer:"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500
    )
    
    return response.choices[0].message.content

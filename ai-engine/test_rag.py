from sentence_transformers import SentenceTransformer
import chromadb

print("Loading AI model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded!")

chunks = [
    "def login(username, password): checks credentials against DB",
    "def send_email(to, subject): sends email via SMTP",
    "def calculate_total(cart): sums all item prices"
]

print("Converting code to vectors...")
embeddings = model.encode(chunks).tolist()

client = chromadb.Client()
col = client.create_collection("test")
col.add(documents=chunks, embeddings=embeddings, ids=["1","2","3"])

question = "how does the user log in?"
print(f"\nQuestion: {question}")

q_emb = model.encode([question]).tolist()
results = col.query(query_embeddings=q_emb, n_results=1)

print("Answer chunk:", results['documents'][0][0])
print("\nIf you see the login chunk above — your project works!")

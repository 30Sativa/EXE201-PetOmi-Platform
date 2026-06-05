from app.rag.embedder import embed_text
print("Testing embed_text function...")
vector = embed_text("Chó con nên được tiêm phòng khi nào?")

print("Vector length:", len(vector))
print("First 5 values:", vector[:5])
import os
from supabase import create_client
from bertopic import BERTopic
from bertopic.representation import HuggingFace

# 1. Securely fetch your free environment keys
SUPABASE_URL = os.environ.get("SUPABASE_PROJECT_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
HF_TOKEN = os.environ.get("HF_TOKEN")

if not all([SUPABASE_URL, SUPABASE_KEY, HF_TOKEN]):
    raise ValueError("Missing one or more required environment variables!")

# 2. Connect to Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 3. Pull essay data
response = supabase.table("essays").select("id", "content").execute()
essays = response.data

docs = [essay["content"] for essay in essays]
doc_ids = [essay["id"] for essay in essays]

# 4. Use Hugging Face's free API to generate thematic cluster titles
# We use a highly capable open-source instructor model completely for free
representation_model = HuggingFace(
    model_name="meta-llama/Llama-3.2-3B-Instruct",
    token=HF_TOKEN,
    task="text-generation"
)

# Initialize BERTopic. Leaving embedding_model empty automatically uses 
# the excellent, free "all-MiniLM-L6-v2" model locally.
topic_model = BERTopic(representation_model=representation_model)

# Run the free pipeline
topics, _ = topic_model.fit_transform(docs)
coordinates_df = topic_model.visualize_documents(docs, return_df=True)

# 5. Push data back to Supabase
for i, doc_id in enumerate(doc_ids):
    theme_name = topic_model.get_topic_info(topics[i])["Name"].values[0]
    theme_name = theme_name.split("_")[-1].strip()

    # Normalize UMAP's relative output and spread it across the 4000px canvas space
    # Adding a margin of 500px so items don't clip off the absolute edge
    raw_x = float(coordinates_df.iloc[i]["X"])
    raw_y = float(coordinates_df.iloc[i]["Y"])

    # Basic normalization technique to bound raw coordinates nicely
    # (Adjust multipliers depending on your default dataset spread)
    scaled_x = 2000 + (raw_x * 150) 
    scaled_y = 2000 + (raw_y * 150)

    supabase.table("writing_pieces").update({
        "x": scaled_x,
        "y": scaled_y,
        "theme_label": theme_name
    }).eq("id", doc_id).execute()

print("Free portfolio layout update completed successfully!")
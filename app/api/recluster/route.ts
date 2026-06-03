import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Secure admin key initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Fetch all pieces from the database
    const { data: pieces, error: fetchErr } = await supabase
      .from("writing_pieces")
      .select("id, content");

    if (fetchErr || !pieces || pieces.length === 0) {
      return NextResponse.json({ error: "No pieces found" }, { status: 400 });
    }

    // 2. Delegate vector generation to Supabase's free built-in RPC transformer
    // This offloads the heavy lifting from Vercel's serverless functions
    const essaysWithVectors = await Promise.all(
      pieces.map(async (piece) => {
        const { data, error } = await supabase.rpc("get_embedding", {
          input_text: piece.content,
        });

        if (error || !data) {
          throw new Error(`Embedding failed for piece ${piece.id}: ${error?.message}`);
        }
        return { id: piece.id, vector: data as number[] };
      })
    );

    // 3. Fast Cosine-Distance 2D Projector Matrix
    const total = essaysWithVectors.length;
    const updates = essaysWithVectors.map((item, index) => {
      let xRaw = 0;
      let yRaw = 0;

      essaysWithVectors.forEach((other, otherIdx) => {
        if (index === otherIdx) return;
        // Calculate the cosine similarity dot product
        const dotProduct = item.vector.reduce((sum, val, i) => sum + val * other.vector[i], 0);
        xRaw += dotProduct * Math.cos((otherIdx / total) * 2 * Math.PI);
        yRaw += dotProduct * Math.sin((otherIdx / total) * 2 * Math.PI);
      });

      // Map values directly into your canvas dimensional scale with balanced padding margins
      const x_coord = Math.floor(((xRaw + total) / (total * 2)) * 3200 + 400);
      const y_coord = Math.floor(((yRaw + total) / (total * 2)) * 3200 + 400);

      return { id: item.id, x_coord, y_coord, embedding: item.vector };
    });

    // 4. Batch-update the structural coordinates and embeddings in your database
    for (const update of updates) {
      await supabase
        .from("writing_pieces")
        .update({ x_coord: update.x_coord, y_coord: update.y_coord, embedding: update.embedding })
        .eq("id", update.id);
    }

    return NextResponse.json({ success: true, message: "Constellation recalibrated seamlessly." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
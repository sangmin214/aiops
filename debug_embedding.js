const { generateEmbedding } = require('./backend/knowledge/embedding');

async function debugEmbedding() {
  const text = "flowmanager.exe无法处理消息，怎么办";
  console.log("Generating embedding for:", text);
  
  const embedding = await generateEmbedding(text);
  console.log("Embedding length:", embedding.length);
  console.log("First 10 values:", embedding.slice(0, 10));
}

debugEmbedding();
import { pipeline } from '@huggingface/transformers';

let generator;
let loading;
const modelId = 'onnx-community/Qwen3-0.6B-ONNX';

async function loadModel() {
  if (generator) return generator;
  if (!loading) {
    loading = pipeline('text-generation', modelId, {
      device: 'webgpu',
      dtype: 'q4f16',
      progress_callback: (progress) => {
        if (progress.status === 'progress' && Number.isFinite(progress.progress)) {
          self.postMessage({ type: 'progress', percent: Math.round(progress.progress) });
        }
      }
    }).then((value) => { generator = value; return value; });
  }
  return loading;
}

self.onmessage = async ({ data }) => {
  const id = data.id;
  try {
    if (data.type === 'load') {
      await loadModel();
      self.postMessage({ type: 'ready', id, model: modelId });
    } else if (data.type === 'generate') {
      const model = await loadModel();
      const output = await model(data.messages, {
        max_new_tokens: 110,
        do_sample: true,
        temperature: 0.7,
        top_p: 0.8,
        tokenizer_encode_kwargs: { enable_thinking: false }
      });
      const generated = output[0]?.generated_text;
      const content = Array.isArray(generated) ? generated.at(-1)?.content : generated;
      self.postMessage({ type: 'reply', id, content: content || '' });
    }
  } catch (error) {
    self.postMessage({ type: 'error', id, message: error instanceof Error ? error.message : String(error) });
  }
};

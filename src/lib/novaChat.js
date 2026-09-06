import { conversationApi, openaiApi } from "./api";

export async function ensureConversation(title) {
  const { data } = await conversationApi.list();
  const existing = (data || []).find((item) => item.title === title);
  if (existing) return existing;
  return conversationApi.create({ title });
}

export async function findConversation(title) {
  const { data } = await conversationApi.list();
  return (data || []).find((item) => item.title === title) || null;
}

export async function loadConversationMessages(title) {
  const conversation = await findConversation(title);
  if (!conversation) return { conversation: null, messages: [] };
  const { data } = await conversationApi.messages(conversation.id);
  return { conversation, messages: data || [] };
}

export async function generateEmail({
  prompt,
  context = false,
  conversationTitle = "Message Crafter",
}) {
  const conversation = await ensureConversation(conversationTitle);
  const result = await openaiApi.generateMessage({
    conversationId: conversation.id,
    prompt,
    context,
  });
  return { data: result.data, conversation };
}

export async function craftEmail({
  prompt,
  tone,
  audience,
  conversationTitle = "Message Crafter",
}) {
  const composed = [
    "Write a complete marketing email with a subject line.",
    prompt ? `Goal: ${prompt}` : "",
    tone ? `Tone: ${tone}` : "",
    audience ? `Audience: ${audience}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { data } = await generateEmail({
    prompt: composed,
    context: false,
    conversationTitle,
  });
  return data;
}

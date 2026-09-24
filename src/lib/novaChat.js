import { conversationApi, openaiApi } from "./api";

export async function ensureConversation(title) {
  try {
    const res = await conversationApi.list();
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    const existing = list.find((item) => item.title === title);
    if (existing) return existing;
    const created = await conversationApi.create({ title });
    return created?.data || created;
  } catch (err) {
    console.warn("[novaChat] ensureConversation fallback:", err.message);
    return null;
  }
}

export async function findConversation(title) {
  try {
    const res = await conversationApi.list();
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    return list.find((item) => item.title === title) || null;
  } catch {
    return null;
  }
}

export async function loadConversationMessages(title) {
  const conversation = await findConversation(title);
  if (!conversation) return { conversation: null, messages: [] };
  const convId = conversation.id || conversation._id;
  if (!convId) return { conversation, messages: [] };
  const { data } = await conversationApi.messages(convId);
  return { conversation, messages: data || [] };
}

export async function generateEmail({
  prompt,
  context = true,
  tone,
  audience,
  conversationTitle = "Message Crafter",
  conversationId,
}) {
  let conversation = null;
  try {
    if (conversationId) {
      conversation = { id: conversationId };
    } else {
      conversation = await ensureConversation(conversationTitle);
    }
  } catch (err) {
    console.warn("[novaChat] Could not load conversation:", err.message);
  }

  const convId = conversation?.id || conversation?._id || conversation?.data?.id || null;
  const result = await openaiApi.generateMessage({
    conversationId: convId,
    prompt,
    tone,
    audience,
    // Keep thread so follow-ups revise the last draft like ChatGPT
    context: Boolean(context && convId),
  });
  return { data: result?.data, conversation: conversation || { id: convId } };
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
    context: true,
    tone,
    audience,
    conversationTitle,
  });
  return data;
}

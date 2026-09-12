import { formatDate } from "./auth";

export function normalizeCampaignStatus(campaign) {
  const status = String(campaign?.status || "").toLowerCase();
  if (["draft", "processing", "completed", "failed", "scheduled", "sent"].includes(status)) {
    if (status === "sent") return "completed";
    return status;
  }
  const camp = String(campaign?.camp_status || "").toLowerCase();
  if (camp.includes("process")) return "processing";
  if (camp.includes("fail")) return "failed";
  if (camp.includes("sent") || camp.includes("complete")) return "completed";
  if (camp.includes("schedul")) return "scheduled";
  if (campaign?.scheduledDate && new Date(campaign.scheduledDate) > new Date()) return "scheduled";
  return status || "draft";
}

export function mailsForCampaign(mails, campaignId) {
  return (mails || []).filter((mail) => String(mail.campaign_id) === String(campaignId));
}

export function campaignMetrics(campaign, mails = []) {
  const related = mailsForCampaign(mails, campaign.id);

  const recipients =
    related.length > 0
      ? related.length
      : Number(campaign.total_recipients) > 0
        ? Number(campaign.total_recipients)
        : 0;
  const sentFromMails = related.filter(
    (mail) => mail.delivery_status === "sent" || mail.delivery_status === "opened" || mail.status || mail.sent_at
  ).length;
  const failedFromMails = related.filter((mail) => mail.delivery_status === "failed").length;
  const opened = related.filter(
    (mail) => (Number(mail.open_count) || 0) > 0 || mail.delivery_status === "opened"
  ).length;
  const clicked = related.filter((mail) => (Number(mail.click_count) || 0) > 0).length;

  const sent =
    campaign.sent_count !== undefined && campaign.sent_count !== null && Number(campaign.sent_count) > 0
      ? Number(campaign.sent_count)
      : (sentFromMails > 0 ? sentFromMails : (opened > 0 ? opened : 0));
  const failed =
    campaign.failed_count !== undefined && campaign.failed_count !== null
      ? Number(campaign.failed_count)
      : failedFromMails;
  const totalOpens = related.reduce(
    (acc, mail) => acc + (Number(mail.open_count) || (mail.delivery_status === "opened" ? 1 : 0)),
    0
  );
  const totalClicks = related.reduce((acc, mail) => acc + (Number(mail.click_count) || 0), 0);
  const openBase = sent > 0 ? sent : recipients;
  const openRate = openBase > 0 ? Number(((opened / openBase) * 100).toFixed(1)) : 0;
  const clickRate = openBase > 0 ? Number(((clicked / openBase) * 100).toFixed(1)) : 0;

  return {
    recipients,
    sent: sent > 0 ? sent : (opened > 0 ? opened : sentFromMails),
    failed,
    opened,
    unopened: Math.max((sent > 0 ? sent : recipients) - opened, 0),
    clicked,
    totalOpens,
    totalClicks,
    openRate,
    clickRate,
  };
}

export function toCampaignRow(campaign, mails = []) {
  const metrics = campaignMetrics(campaign, mails);
  return {
    id: campaign.id,
    name: campaign.title,
    sender_name: campaign.sender_name || "",
    sender_email: campaign.sender_email || "",
    subject: campaign.subject || "No subject yet",
    body: campaign.body || "",
    status: normalizeCampaignStatus(campaign),
    recipients: metrics.recipients,
    sent: metrics.sent,
    failed: metrics.failed,
    opened: metrics.opened,
    clicked: metrics.clicked,
    unopened: metrics.unopened,
    openRate: metrics.openRate,
    clickRate: metrics.clickRate,
    date: formatDate(campaign.scheduledDate || campaign.createdAt),
    list: campaign.title,
    raw: campaign,
  };
}

export function buildWeeklyPerformance(mails = []) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets = days.map((day) => ({ day, sent: 0, opened: 0, opens: 0, clicks: 0 }));
  const now = new Date();
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  mails.forEach((mail) => {
    const stamp = mail.sent_at || mail.updatedAt || mail.createdAt;
    if (!stamp) return;
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime()) || date.getTime() < weekAgo) return;
    const bucket = buckets[date.getDay()];
    bucket.sent += 1;
    if ((Number(mail.open_count) || 0) > 0) {
      bucket.opened += 1;
      bucket.opens += Number(mail.open_count) || 1;
    }
    if ((Number(mail.click_count) || 0) > 0) {
      bucket.clicks += Number(mail.click_count) || 1;
    }
  });

  return [...buckets.slice(1), buckets[0]];
}

export function buildMonthlyData(campaigns = [], mails = []) {
  const now = new Date();
  const months = [];
  for (let i = 7; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleString("en-US", { month: "short" }),
      emails: 0,
      campaigns: 0,
    });
  }

  const index = Object.fromEntries(months.map((item) => [item.key, item]));

  campaigns.forEach((campaign) => {
    const date = new Date(campaign.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (index[key]) index[key].campaigns += 1;
  });

  mails.forEach((mail) => {
    const date = new Date(mail.sent_at || mail.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (index[key]) index[key].emails += 1;
  });

  return months;
}

export function mailEvent(mail, campaignsById) {
  const clicked = (Number(mail.click_count) || 0) > 0;
  const opened = (Number(mail.open_count) || 0) > 0 || mail.delivery_status === "opened";
  const bounced = String(mail.email || "").includes("invalid") || mail.delivery_status === "failed";
  let event = "Queued";
  if (clicked) event = "Clicked";
  else if (opened) event = "Opened";
  else if (mail.delivery_status === "sent" || mail.status || mail.sent_at) event = "Sent";
  if (bounced) event = "Bounced";

  const opens = Number(mail.open_count) || (mail.delivery_status === "opened" ? 1 : 0);
  const clicks = Number(mail.click_count) || 0;

  return {
    id: mail.id,
    email: mail.email || "unknown",
    name: mail.full_name || "",
    campaign: campaignsById[String(mail.campaign_id)]?.title || "Campaign",
    event,
    time: formatDate(mail.last_opened_at || mail.sent_at || mail.updatedAt || mail.createdAt),
    device: clicked ? "Web link" : opened ? "Email client" : "—",
    openCount: opens,
    clickCount: clicks,
  };
}

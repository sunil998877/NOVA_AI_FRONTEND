import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, UserPlus, X, Loader2, Check, Users, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { contactApi, recipientApi } from "../lib/api";
import { useToast } from "./ui/toast";

export function RecipientManagerModal({ open, onOpenChange, campaign, onSuccess }) {
  const [contacts, setContacts] = useState([]);
  const [existingIds, setExistingIds] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [contactsError, setContactsError] = useState("");
  const [view, setView] = useState("list"); // list | manual
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState("");
  const searchTimer = useRef(null);
  const toast = useToast();

  const resetManualForm = () => {
    setManualName("");
    setManualEmail("");
    setManualCompany("");
    setManualError("");
  };

  const fetchContacts = useCallback(async (q = "") => {
    setLoadingContacts(true);
    setContactsError("");
    try {
      const res = await contactApi.list(q, 1, 100);
      setContacts(res.data || []);
    } catch (err) {
      setContactsError(err.message || "Could not load contacts");
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const fetchExisting = useCallback(async () => {
    if (!campaign?.id) return;
    setLoadingRecipients(true);
    try {
      const res = await recipientApi.list(campaign.id);
      const ids = new Set((res.data || []).map((r) => Number(r.contact_id)));
      setExistingIds(ids);
      setSelected(new Set(ids));
    } catch {
      setExistingIds(new Set());
      setSelected(new Set());
    } finally {
      setLoadingRecipients(false);
    }
  }, [campaign?.id]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelected(new Set());
    setExistingIds(new Set());
    setView("list");
    resetManualForm();
    fetchContacts("");
    fetchExisting();
  }, [open, fetchContacts, fetchExisting]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchContacts(q), 350);
  };

  const toggleContact = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const allIds = contacts.map((c) => Number(c.id));
    const allSelected = allIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleManualAdded = (contact) => {
    if (!contact?.id) return;
    const id = Number(contact.id);
    setContacts((prev) => {
      const exists = prev.some((c) => Number(c.id) === id);
      return exists
        ? prev.map((c) => (Number(c.id) === id ? { ...c, ...contact } : c))
        : [contact, ...prev];
    });
    setSelected((prev) => new Set([...prev, id]));
    setView("list");
    resetManualForm();
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualError("");

    if (!manualName.trim()) {
      setManualError("Name is required");
      return;
    }
    if (!manualEmail.trim()) {
      setManualError("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manualEmail.trim())) {
      setManualError("Invalid email format");
      return;
    }

    setManualSaving(true);
    try {
      const res = await contactApi.create({
        name: manualName.trim(),
        email: manualEmail.trim(),
        company: manualCompany.trim() || undefined,
      });
      const contact = res?.data || res;
      if (!contact?.id) {
        throw new Error("Contact was saved but no ID was returned");
      }
      toast.success("Contact saved", `${contact.name || manualName.trim()} was saved to contacts.`);
      handleManualAdded(contact);
    } catch (err) {
      setManualError(err.message || "Could not save contact");
    } finally {
      setManualSaving(false);
    }
  };

  const handleRemove = async (contactId) => {
    setRemoving(contactId);
    try {
      const res = await recipientApi.remove(campaign.id, contactId);
      setExistingIds((prev) => {
        const next = new Set(prev);
        next.delete(contactId);
        return next;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(contactId);
        return next;
      });
      toast.success("Recipient removed");
      onSuccess?.(res.total);
    } catch (err) {
      toast.error("Could not remove recipient", err.message);
    } finally {
      setRemoving(null);
    }
  };

  const handleAdd = async () => {
    if (!campaign?.id) return;
    const newIds = [...selected].filter((id) => !existingIds.has(id));
    if (newIds.length === 0) {
      toast.warning("No new recipients", "All selected contacts are already in this campaign.");
      return;
    }
    setSaving(true);
    try {
      const res = await recipientApi.add(campaign.id, newIds);
      toast.success(
        "Recipients added",
        `Added ${res.added} recipient${res.added === 1 ? "" : "s"} to "${campaign.name}".`
      );
      onOpenChange(false);
      onSuccess?.(res.total);
    } catch (err) {
      toast.error("Could not add recipients", err.message);
    } finally {
      setSaving(false);
    }
  };

  const allIds = contacts.map((c) => Number(c.id));
  const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someChecked = allIds.some((id) => selected.has(id)) && !allChecked;
  const newCount = [...selected].filter((id) => !existingIds.has(id)).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setView("list");
          resetManualForm();
        }
        onOpenChange(nextOpen);
      }}
      modal
    >
      <DialogContent className="max-w-lg">
        {view === "manual" ? (
          <form onSubmit={handleManualSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView("list");
                    resetManualForm();
                  }}
                  className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Back to contact list"
                >
                  <ArrowLeft className="size-4" />
                </button>
                Add Recipient Manually
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="manual-name">Name</Label>
                <Input
                  id="manual-name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  disabled={manualSaving}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manual-email">Email</Label>
                <Input
                  id="manual-email"
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={manualSaving}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manual-company">Company (optional)</Label>
                <Input
                  id="manual-company"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  placeholder="Company name"
                  disabled={manualSaving}
                />
              </div>
              {manualError ? <p className="text-sm text-destructive">{manualError}</p> : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setView("list");
                  resetManualForm();
                }}
                disabled={manualSaving}
              >
                Back
              </Button>
              <Button type="submit" disabled={manualSaving}>
                {manualSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Contact"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Add Recipients
                {campaign ? (
                  <span className="text-muted-foreground font-normal text-sm ml-1">— {campaign.name}</span>
                ) : null}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="recipient-search"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
              </div>

              {loadingContacts || loadingRecipients ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mr-2" />
                  <span className="text-sm">Loading contacts...</span>
                </div>
              ) : contactsError ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <p className="text-sm text-destructive">{contactsError}</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => fetchContacts(search)}>
                    Retry
                  </Button>
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                  <Users className="size-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {search ? "No contacts found." : "No contacts available."}
                  </p>
                  <p className="text-xs mt-1">
                    {search ? `No results for "${search}".` : "Add your first recipient manually."}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-4 gap-1.5"
                    onClick={() => setView("manual")}
                  >
                    <UserPlus className="size-3.5" />
                    Add Manually
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent cursor-pointer select-none border-b border-border mb-1">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={toggleAll}
                      className="accent-primary size-4 cursor-pointer"
                      id="select-all-contacts"
                    />
                    <span className="text-sm font-medium">Select All</span>
                    <span className="ml-auto text-xs text-muted-foreground">{contacts.length} contacts</span>
                  </label>

                  <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5 pr-1">
                    {contacts.map((contact) => {
                      const id = Number(contact.id);
                      const isExisting = existingIds.has(id);
                      const isSelected = selected.has(id);
                      return (
                        <div
                          key={id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent cursor-pointer select-none transition-colors ${
                            isSelected ? "bg-primary/8" : ""
                          }`}
                          onClick={() => toggleContact(id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleContact(id)}
                            onClick={(e) => e.stopPropagation()}
                            className="accent-primary size-4 cursor-pointer flex-shrink-0"
                            id={`contact-${id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{contact.name}</span>
                              {isExisting && (
                                <span className="flex items-center gap-0.5 text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5 shrink-0">
                                  <Check className="size-3" /> Added
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {contact.email}
                              {contact.company ? ` · ${contact.company}` : ""}
                            </div>
                          </div>
                          {isExisting && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(id);
                              }}
                              disabled={removing === id}
                              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                              title="Remove from campaign"
                            >
                              {removing === id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Selected: <span className="font-semibold text-foreground">{selected.size}</span> recipient
                  {selected.size !== 1 ? "s" : ""}
                  {newCount > 0 && existingIds.size > 0 ? (
                    <span className="ml-1 text-primary">({newCount} new)</span>
                  ) : null}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setView("manual")}
                >
                  <UserPlus className="size-3.5" />
                  Add Manually
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAdd} disabled={saving || newCount === 0}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add Recipients${newCount > 0 ? ` (${newCount})` : ""}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

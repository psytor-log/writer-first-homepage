import { useState } from "react";
import { apiUrl } from "../config/api";
import { homeContent } from "../content/homeContent";

export function GuestbookForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("보내는 중입니다.");
    try {
      const response = await fetch(apiUrl("/api/guestbook"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, message, isPrivate }) });
      if (!response.ok) throw new Error("submission_failed");
      setName(""); setEmail(""); setMessage(""); setIsPrivate(false);
      setStatus("글을 남겼습니다. 고맙습니다.");
    } catch {
      setStatus("지금은 글을 받을 수 없습니다. 잠시 뒤 다시 시도해 주세요.");
    }
  };

  return <section className="guestbook-form" id="leave-message"><h2>{homeContent.labels.guestbook}</h2><p>{homeContent.labels.guestbookDescription}</p><form onSubmit={submit}><label>{homeContent.labels.guestbookName}<input value={name} maxLength={40} required onChange={(event) => setName(event.target.value)} /></label><label>{homeContent.labels.guestbookEmail}<input value={email} type="email" required onChange={(event) => setEmail(event.target.value)} /></label><label>{homeContent.labels.guestbookMessage}<textarea value={message} maxLength={1000} required rows={5} onChange={(event) => setMessage(event.target.value)} /></label><label className="private-option"><input type="checkbox" checked={isPrivate} onChange={(event) => setIsPrivate(event.target.checked)} />{homeContent.labels.guestbookPrivate}</label><button type="submit">{homeContent.labels.guestbookSubmit} →</button></form>{status && <p className="guestbook-status" role="status">{status}</p>}</section>;
}

"""
Wedding Invite Email Sender
Sends personalised HTML invitations to guests from a CSV list.

Usage:
  python send_invites.py                    # Send to all unsent guests
  python send_invites.py --test             # Send only to Mark as a test
  python send_invites.py --dry-run          # Preview without sending

Requires SMTP_USER and SMTP_PASS env vars (or reads from job-monitor .env).
"""

import csv
import smtplib
import os
import sys
import time
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────
BATCH_SIZE = 50
BATCH_DELAY = 60  # seconds between batches (Gmail rate limits)
SITE_URL = "https://YOUR_GITHUB_USERNAME.github.io/wedding-site/"
GUESTS_CSV = Path(__file__).parent / "guests.csv"
SEND_LOG = Path(__file__).parent / "send_log.csv"
ENV_FILE = Path(__file__).parent.parent.parent / "job-monitor" / ".env"


def load_env():
    """Load SMTP creds from job-monitor .env if not already set."""
    if os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"):
        return
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())


def get_already_sent():
    """Return set of emails already sent (from log)."""
    sent = set()
    if SEND_LOG.exists():
        with open(SEND_LOG, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("status") == "sent":
                    sent.add(row["email"].lower())
    return sent


def log_send(name, email, status, error=""):
    """Append to send log CSV."""
    write_header = not SEND_LOG.exists()
    with open(SEND_LOG, "a", newline="") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(["timestamp", "name", "email", "status", "error"])
        writer.writerow([datetime.now().isoformat(), name, email, status, error])


def build_email_html(name, guest_type):
    """Build the personalised HTML invite email."""
    # Determine if they're invited to day 1 + 2 or day 2 only
    is_full_invite = guest_type.strip().lower() in ("day1+day2", "full", "day1")

    if is_full_invite:
        event_details = """
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">
                <strong style="color: #5c7a5c;">Ceremony</strong><br>
                Friday, 26th June 2026 at 1:30 PM<br>
                Holy Trinity Abbey Church, Adare
            </td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #e8e0d4;">
                <strong style="color: #5c7a5c;">Reception</strong><br>
                Dinner, Dancing &amp; Festivities<br>
                The Dunraven Arms, Adare
            </td></tr>
            <tr><td style="padding: 12px 0;">
                <strong style="color: #5c7a5c;">Day Two</strong><br>
                Saturday, 27th June 2026 from 4 PM<br>
                Bill Chawke's Bar, Adare
            </td></tr>
        """
    else:
        event_details = """
            <tr><td style="padding: 12px 0;">
                <strong style="color: #5c7a5c;">Evening Celebration</strong><br>
                Saturday, 27th June 2026 from 4 PM<br>
                Bill Chawke's Bar, Adare<br>
                <span style="color: #999; font-size: 13px;">Music, food &amp; drinks</span>
            </td></tr>
        """

    return f"""
    <html>
    <body style="margin: 0; padding: 0; background-color: #f5f0eb; font-family: Georgia, 'Times New Roman', serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0eb; padding: 40px 20px;">
            <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #fffef9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr><td style="background: linear-gradient(135deg, #5c7a5c 0%, #7a9a7a 100%); padding: 48px 40px; text-align: center;">
                        <p style="color: #d4c5a0; font-size: 14px; letter-spacing: 4px; margin: 0 0 8px 0; text-transform: uppercase;">You're Invited</p>
                        <h1 style="color: #fffef9; font-size: 42px; margin: 0; font-weight: 400; letter-spacing: 2px;">Ciara &amp; Mark</h1>
                        <p style="color: #d4c5a0; font-size: 16px; margin: 12px 0 0 0; letter-spacing: 2px;">26 &middot; 06 &middot; 26</p>
                    </td></tr>

                    <!-- Body -->
                    <tr><td style="padding: 40px;">
                        <p style="font-size: 18px; color: #4a4a4a; margin: 0 0 24px 0; line-height: 1.6;">
                            Dear {name},
                        </p>
                        <p style="font-size: 16px; color: #666; margin: 0 0 32px 0; line-height: 1.8;">
                            We would be delighted if you could join us to celebrate our wedding.
                            Your presence would mean the world to us.
                        </p>

                        <!-- Event details -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 32px;">
                            {event_details}
                        </table>

                        <p style="font-size: 14px; color: #999; margin: 0 0 8px 0; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Dress Code</p>
                        <p style="font-size: 16px; color: #4a4a4a; margin: 0 0 32px 0; text-align: center; font-weight: bold;">Black Tie</p>

                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr><td align="center">
                                <a href="{SITE_URL}" style="display: inline-block; padding: 16px 48px; background: #5c7a5c; color: #fffef9; text-decoration: none; border-radius: 8px; font-size: 16px; letter-spacing: 1px; font-family: Georgia, serif;">
                                    View Your Invitation &amp; RSVP
                                </a>
                            </td></tr>
                        </table>

                        <p style="font-size: 14px; color: #999; margin: 24px 0 0 0; text-align: center;">
                            Please RSVP by 1st May 2026
                        </p>
                    </td></tr>

                    <!-- Footer -->
                    <tr><td style="background: #f5f0eb; padding: 24px 40px; text-align: center;">
                        <p style="font-size: 13px; color: #aaa; margin: 0;">
                            With love, Ciara &amp; Mark
                        </p>
                    </td></tr>

                </table>
            </td></tr>
        </table>
    </body>
    </html>
    """


def build_plain_text(name, guest_type):
    """Plain text fallback."""
    is_full = guest_type.strip().lower() in ("day1+day2", "full", "day1")
    text = f"Dear {name},\n\n"
    text += "We would be delighted if you could join us to celebrate our wedding.\n\n"
    if is_full:
        text += "CEREMONY\nFriday, 26th June 2026 at 1:30 PM\nHoly Trinity Abbey Church, Adare\n\n"
        text += "RECEPTION\nThe Dunraven Arms, Adare\n\n"
        text += "DAY TWO\nSaturday, 27th June 2026 from 4 PM\nBill Chawke's Bar, Adare\n\n"
    else:
        text += "EVENING CELEBRATION\nSaturday, 27th June 2026 from 4 PM\nBill Chawke's Bar, Adare\n\n"
    text += "Dress Code: Black Tie\n\n"
    text += f"View your invitation & RSVP: {SITE_URL}\n\n"
    text += "Please RSVP by 1st May 2026\n\n"
    text += "With love,\nCiara & Mark\n"
    return text


def send_invites(dry_run=False, test_only=False):
    """Main send loop."""
    load_env()

    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")

    if not smtp_user or not smtp_pass:
        print("ERROR: SMTP_USER and SMTP_PASS not set.")
        print(f"Set them as env vars or ensure {ENV_FILE} exists.")
        sys.exit(1)

    if not GUESTS_CSV.exists():
        print(f"ERROR: Guest list not found at {GUESTS_CSV}")
        print("Create it with columns: Name, Email, Type")
        sys.exit(1)

    # Load guests
    guests = []
    with open(GUESTS_CSV, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("Email", "").strip():
                guests.append(row)

    if test_only:
        guests = [{"Name": "Mark (Test)", "Email": smtp_user, "Type": "day1+day2"}]
        print(f"TEST MODE: Sending only to {smtp_user}")

    already_sent = get_already_sent()
    to_send = [g for g in guests if g["Email"].strip().lower() not in already_sent]

    if not to_send:
        print("All guests have already been sent invites. Nothing to do.")
        return

    print(f"Guests to invite: {len(to_send)} (of {len(guests)} total, {len(already_sent)} already sent)")

    if dry_run:
        for g in to_send:
            print(f"  [DRY RUN] Would send to: {g['Name']} <{g['Email']}> ({g.get('Type', 'day1+day2')})")
        return

    sent_count = 0
    fail_count = 0

    for i, guest in enumerate(to_send):
        name = guest["Name"].strip()
        email = guest["Email"].strip()
        guest_type = guest.get("Type", "day1+day2").strip()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "You're Invited — Ciara & Mark's Wedding"
        msg["From"] = f"Ciara & Mark <{smtp_user}>"
        msg["To"] = email

        msg.attach(MIMEText(build_plain_text(name, guest_type), "plain"))
        msg.attach(MIMEText(build_email_html(name, guest_type), "html"))

        try:
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, email, msg.as_string())

            log_send(name, email, "sent")
            sent_count += 1
            print(f"  [{sent_count}/{len(to_send)}] Sent to {name} <{email}>")

        except Exception as e:
            log_send(name, email, "failed", str(e))
            fail_count += 1
            print(f"  [FAIL] {name} <{email}>: {e}")

        # Batch delay to respect Gmail rate limits
        if (i + 1) % BATCH_SIZE == 0 and (i + 1) < len(to_send):
            print(f"  ... Pausing {BATCH_DELAY}s (batch limit) ...")
            time.sleep(BATCH_DELAY)

    print(f"\nDone! Sent: {sent_count}, Failed: {fail_count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send wedding invite emails")
    parser.add_argument("--test", action="store_true", help="Send test email to yourself only")
    parser.add_argument("--dry-run", action="store_true", help="Preview without sending")
    args = parser.parse_args()

    send_invites(dry_run=args.dry_run, test_only=args.test)

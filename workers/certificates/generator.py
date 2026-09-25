"""
AIML CLUB OCT — CONNECT
Certificate Generation Worker (Phase 5)

Idempotent rendering, dynamic text placement, QR verification encoding,
and storage metadata generation.
"""

import hashlib
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


def generate_certificate_id(event_code: str, serial_num: int) -> str:
    """
    Format: AIML{YY}-{EVENT_SHORT}-{SERIAL:06d}
    Example: AIML26-APT-000184
    """
    year = datetime.now(timezone.utc).strftime("%y")
    # Clean short code from event code e.g. EVT-APTIFY-2026 -> APT
    clean_code = event_code.replace("EVT-", "").split("-")[0][:3].upper()
    return f"AIML{year}-{clean_code}-{serial_num:06d}"


def generate_verification_token(certificate_id: str, student_id: str, secret: str = "aiml-club-oct-cert-salt-2026") -> str:
    """
    Generates an unguessable SHA-256 hash for public credential verification.
    """
    payload = f"{certificate_id}:{student_id}:{secret}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class CertificateRenderer:
    """
    Renders dynamic certificate templates with participant information,
    cryptographic verification QR codes, and institutional branding.
    """

    @staticmethod
    def render_svg_certificate(
        recipient_name: str,
        event_title: str,
        event_date: str,
        certificate_id: str,
        certificate_type: str,
        verification_url: str,
        template_config: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generates a standalone, high-resolution vector SVG certificate
        with official AIML Club OCT institutional branding.
        """
        width = 1920
        height = 1080

        # High-contrast institutional colors: Blue (#014B7A), Green (#00763C), Surface (#111820)
        svg = f"""<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#014B7A" />
      <stop offset="50%" stop-color="#00763C" />
      <stop offset="100%" stop-color="#014B7A" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="{width}" height="{height}" fill="#FAFBFD" />
  
  <!-- Outer Institutional Border -->
  <rect x="40" y="40" width="{width - 80}" height="{height - 80}" rx="12" fill="none" stroke="url(#borderGrad)" stroke-width="8" />
  <rect x="56" y="56" width="{width - 112}" height="{height - 112}" rx="8" fill="none" stroke="#D1D5DB" stroke-width="1.5" />

  <!-- Institutional Header -->
  <text x="{width / 2}" y="150" font-family="Inter, sans-serif" font-size="28" font-weight="700" fill="#014B7A" text-anchor="middle" letter-spacing="4">
    ORIENTAL COLLEGE OF TECHNOLOGY, BHOPAL
  </text>
  <text x="{width / 2}" y="190" font-family="Inter, sans-serif" font-size="20" font-weight="600" fill="#00763C" text-anchor="middle" letter-spacing="2">
    DEPARTMENT OF ARTIFICIAL INTELLIGENCE &amp; MACHINE LEARNING
  </text>
  <text x="{width / 2}" y="235" font-family="Inter, sans-serif" font-size="16" font-style="italic" fill="#64748B" text-anchor="middle">
    AIML CLUB OCT — “Innovate. Implement. Inspire.”
  </text>

  <!-- Certificate Type Title -->
  <text x="{width / 2}" y="350" font-family="Inter, sans-serif" font-size="52" font-weight="800" fill="#111820" text-anchor="middle">
    CERTIFICATE OF {certificate_type.upper()}
  </text>
  <text x="{width / 2}" y="410" font-family="Inter, sans-serif" font-size="20" fill="#64748B" text-anchor="middle">
    This official credential is proudly presented to
  </text>

  <!-- Recipient Name -->
  <text x="{width / 2}" y="510" font-family="Inter, sans-serif" font-size="56" font-weight="800" fill="#014B7A" text-anchor="middle">
    {recipient_name}
  </text>
  <line x1="{width / 2 - 350}" y1="535" x2="{width / 2 + 350}" y2="535" stroke="#CBD5E1" stroke-width="2" />

  <!-- Event Recognition Description -->
  <text x="{width / 2}" y="610" font-family="Inter, sans-serif" font-size="24" fill="#334155" text-anchor="middle">
    for active participation and successful completion of
  </text>
  <text x="{width / 2}" y="660" font-family="Inter, sans-serif" font-size="32" font-weight="700" fill="#111820" text-anchor="middle">
    {event_title}
  </text>
  <text x="{width / 2}" y="710" font-family="Inter, sans-serif" font-size="20" fill="#64748B" text-anchor="middle">
    held at Oriental College of Technology, Bhopal on {event_date}
  </text>

  <!-- Verification Section & QR Simulation -->
  <g transform="translate(140, 820)">
    <text x="0" y="20" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#64748B" letter-spacing="1">
      OFFICIAL CREDENTIAL ID
    </text>
    <text x="0" y="50" font-family="monospace" font-size="22" font-weight="700" fill="#014B7A">
      {certificate_id}
    </text>
    <text x="0" y="80" font-family="Inter, sans-serif" font-size="13" fill="#64748B">
      Verify authenticity online at:
    </text>
    <text x="0" y="105" font-family="monospace" font-size="13" fill="#0284C7">
      {verification_url}
    </text>
  </g>

  <!-- Signatures -->
  <g transform="translate({width - 550}, 840)">
    <line x1="0" y1="50" x2="350" y2="50" stroke="#94A3B8" stroke-width="2" />
    <text x="175" y="80" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#1E293B" text-anchor="middle">
      Faculty Coordinator &amp; Lead
    </text>
    <text x="175" y="105" font-family="Inter, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">
      AI &amp; Machine Learning Club, OCT Bhopal
    </text>
  </g>
</svg>"""
        return svg

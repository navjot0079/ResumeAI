"""
PDF report generation service using ReportLab.
Generates a structured improvement report from analysis data.
"""

import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER


def _get_score_color(score: int):
    """Return a color based on score value."""
    if score >= 70:
        return colors.HexColor("#059669")  # emerald
    elif score >= 40:
        return colors.HexColor("#d97706")  # amber
    return colors.HexColor("#dc2626")  # red


def _get_score_label(score: int) -> str:
    if score >= 80:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Fair"
    elif score >= 30:
        return "Needs Work"
    return "Poor"


def generate_report_pdf(analysis: dict) -> bytes:
    """
    Generate a structured PDF improvement report from analysis data.
    Returns the PDF as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=22,
        textColor=colors.HexColor("#111827"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#6b7280"),
        spaceAfter=20,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#111827"),
        spaceBefore=16,
        spaceAfter=8,
        borderWidth=0,
    )
    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#374151"),
        leading=14,
    )
    bullet_style = ParagraphStyle(
        "BulletText",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#374151"),
        leading=14,
        leftIndent=12,
        bulletIndent=0,
    )
    small_style = ParagraphStyle(
        "SmallText",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#6b7280"),
        leading=12,
    )

    elements = []

    # ── Title ──
    elements.append(Paragraph("Resume Analysis Report", title_style))
    resume_name = analysis.get("resumeName", "Unknown Resume")
    elements.append(Paragraph(f"Resume: {resume_name}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
    elements.append(Spacer(1, 12))

    # ── ATS Score ──
    ats_score = analysis.get("atsScore", 0)
    score_color = _get_score_color(ats_score)
    score_label = _get_score_label(ats_score)

    score_data = [[
        Paragraph(f'<font size="28" color="{score_color.hexval()}">{ats_score}</font><font size="12" color="#9ca3af"> / 100</font>', body_style),
        Paragraph(f'<font size="14" color="{score_color.hexval()}">{score_label}</font><br/><font size="9" color="#6b7280">ATS Compatibility Score</font>', body_style),
    ]]
    score_table = Table(score_data, colWidths=[2 * inch, 4 * inch])
    score_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f9fafb")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 8))

    # Resume summary
    summary = analysis.get("resumeSummary", "")
    if summary:
        elements.append(Paragraph(summary, small_style))
    elements.append(Spacer(1, 8))

    # ── Section Quality Scores ──
    section_scores = analysis.get("sectionScores")
    if section_scores and isinstance(section_scores, dict):
        elements.append(Paragraph("Section Quality Scores", heading_style))

        section_labels = {
            "summary": "Summary / Objective",
            "experience": "Experience",
            "education": "Education",
            "skills": "Skills",
            "projects": "Projects",
            "formatting": "Formatting & Structure",
        }

        table_data = [
            [
                Paragraph('<font size="9" color="#6b7280"><b>Section</b></font>', body_style),
                Paragraph('<font size="9" color="#6b7280"><b>Score</b></font>', body_style),
                Paragraph('<font size="9" color="#6b7280"><b>Feedback</b></font>', body_style),
            ]
        ]

        for key, label in section_labels.items():
            sec = section_scores.get(key, {})
            sec_score = sec.get("score", 0) if isinstance(sec, dict) else 0
            sec_feedback = sec.get("feedback", "—") if isinstance(sec, dict) else "—"
            sec_color = _get_score_color(sec_score)

            table_data.append([
                Paragraph(f'<font size="10">{label}</font>', body_style),
                Paragraph(f'<font size="10" color="{sec_color.hexval()}"><b>{sec_score}</b></font>', body_style),
                Paragraph(f'<font size="9">{sec_feedback}</font>', small_style),
            ])

        sec_table = Table(table_data, colWidths=[1.6 * inch, 0.7 * inch, 3.7 * inch])
        sec_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
        ]))
        elements.append(sec_table)
        elements.append(Spacer(1, 8))

    # ── Matching Skills ──
    matching = analysis.get("matchingSkills", [])
    if matching:
        elements.append(Paragraph("Matching Skills", heading_style))
        elements.append(Paragraph(
            " &bull; ".join(matching),
            ParagraphStyle("GreenText", parent=body_style, textColor=colors.HexColor("#059669")),
        ))
        elements.append(Spacer(1, 4))

    # ── Missing Skills ──
    missing = analysis.get("missingSkills", [])
    if missing:
        elements.append(Paragraph("Missing Skills", heading_style))
        elements.append(Paragraph(
            " &bull; ".join(missing),
            ParagraphStyle("RedText", parent=body_style, textColor=colors.HexColor("#dc2626")),
        ))
        elements.append(Spacer(1, 4))

    # ── Missing Keywords ──
    keywords = analysis.get("missingKeywords", [])
    if keywords:
        elements.append(Paragraph("Missing Keywords", heading_style))
        elements.append(Paragraph(
            " &bull; ".join(keywords),
            ParagraphStyle("AmberText", parent=body_style, textColor=colors.HexColor("#d97706")),
        ))
        elements.append(Spacer(1, 4))

    # ── Strengths ──
    strengths = analysis.get("strengths", [])
    if strengths:
        elements.append(Paragraph("Strengths", heading_style))
        for s in strengths:
            elements.append(Paragraph(f"✓  {s}", bullet_style))
        elements.append(Spacer(1, 4))

    # ── Weaknesses ──
    weaknesses = analysis.get("weaknesses", [])
    if weaknesses:
        elements.append(Paragraph("Weaknesses", heading_style))
        for w in weaknesses:
            elements.append(Paragraph(f"✗  {w}", bullet_style))
        elements.append(Spacer(1, 4))

    # ── Experience Bullet Rewrites ──
    bullets = analysis.get("bulletAnalysis", [])
    if bullets and isinstance(bullets, list) and len(bullets) > 0:
        elements.append(Paragraph("Experience Bullet Improvements", heading_style))
        elements.append(Paragraph(
            "The following bullet points from your resume could be strengthened with more specific, measurable language:",
            small_style,
        ))
        elements.append(Spacer(1, 6))

        for i, bullet in enumerate(bullets, 1):
            if not isinstance(bullet, dict):
                continue
            original = bullet.get("original", "")
            issue = bullet.get("issue", "")
            improved = bullet.get("improved", "")

            bullet_block = []
            bullet_block.append(Paragraph(f'<font size="10"><b>#{i}</b></font>', body_style))
            bullet_block.append(Paragraph(f'<font size="9" color="#dc2626"><b>Original:</b></font> <font size="9">{original}</font>', body_style))
            bullet_block.append(Paragraph(f'<font size="9" color="#d97706"><b>Issue:</b></font> <font size="9">{issue}</font>', body_style))
            bullet_block.append(Paragraph(f'<font size="9" color="#059669"><b>Improved:</b></font> <font size="9">{improved}</font>', body_style))
            bullet_block.append(Spacer(1, 6))
            elements.append(KeepTogether(bullet_block))

    # ── AI Recommendations ──
    suggestions = analysis.get("suggestions", [])
    if suggestions:
        elements.append(Paragraph("AI Recommendations", heading_style))
        for i, s in enumerate(suggestions, 1):
            elements.append(Paragraph(f"<b>{i}.</b>  {s}", bullet_style))
        elements.append(Spacer(1, 4))

    # ── Footer ──
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db")))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        '<font size="8" color="#9ca3af">Generated by ResumeAI — AI Resume Analyzer</font>',
        ParagraphStyle("Footer", parent=body_style, alignment=TA_CENTER),
    ))

    # Build PDF
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

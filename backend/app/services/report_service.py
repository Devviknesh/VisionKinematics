from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.models.analysis import AnalysisSession, AnalysisEvent
from app.models.video import Video
from app.config import settings

class ReportService:
    @staticmethod
    def generate_pdf_report(
        video: Video,
        session: AnalysisSession,
        events: List[AnalysisEvent]
    ) -> Path:
        report_filename = f"Report_{session.id[:8]}_{video.filename}.pdf"
        out_path = settings.REPORTS_DIR / report_filename

        doc = SimpleDocTemplate(
            str(out_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom palette
        primary_color = colors.HexColor("#0f172a")
        accent_color = colors.HexColor("#0284c7")
        text_dark = colors.HexColor("#1e293b")
        text_muted = colors.HexColor("#64748b")
        bg_card = colors.HexColor("#f8fafc")
        border_color = colors.HexColor("#e2e8f0")

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=primary_color
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            textColor=accent_color
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=primary_color,
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=text_dark
        )
        small_style = ParagraphStyle(
            "ReportSmall",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=text_muted
        )
        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#b45309")
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("AI-Powered Video Analysis Report", title_style))
        elements.append(Paragraph("Non-Verbal Communication & Observable Kinematics Analyzer", subtitle_style))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=2, color=accent_color, spaceBefore=4, spaceAfter=12))

        # 2. Metadata Grid
        stats: Dict[str, Any] = session.summary_stats or {}
        gen_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

        meta_data = [
            [Paragraph("<b>Video File:</b>", body_style), Paragraph(video.filename, body_style),
             Paragraph("<b>Generated:</b>", body_style), Paragraph(gen_time, body_style)],
            [Paragraph("<b>Duration:</b>", body_style), Paragraph(f"{video.duration:.1f} seconds", body_style),
             Paragraph("<b>Resolution:</b>", body_style), Paragraph(f"{video.resolution} @ {video.fps:.1f} fps", body_style)],
            [Paragraph("<b>Frames Analyzed:</b>", body_style), Paragraph(str(stats.get("total_frames_analyzed", 0)), body_style),
             Paragraph("<b>Face Tracked:</b>", body_style), Paragraph(f"{stats.get('face_tracking_percentage', 0)}%", body_style)],
        ]
        meta_table = Table(meta_data, colWidths=[1.3*inch, 2.2*inch, 1.3*inch, 2.2*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_card),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # 3. Head Pose & Orientation Analysis
        elements.append(Paragraph("1. Head Pose & Orientation Distribution", h2_style))
        elements.append(Paragraph("Estimated 3D orientation (Yaw, Pitch, Roll) relative to camera perspective:", body_style))
        elements.append(Spacer(1, 4))

        pose_dist = stats.get("head_pose_distribution", {})
        pose_data = [
            ["Orientation Category", "Observed Percentage", "Physical Measurement Focus"],
            ["Forward-Facing", f"{pose_dist.get('Forward-Facing', 0)}%", "Yaw [-12°, +12°], Pitch [-10°, +10°]"],
            ["Turned Leftward", f"{pose_dist.get('Turned Left', 0)}%", "Yaw < -12.0°"],
            ["Turned Rightward", f"{pose_dist.get('Turned Right', 0)}%", "Yaw > +12.0°"],
            ["Tilted Upward", f"{pose_dist.get('Tilted Up', 0)}%", "Pitch > +10.0°"],
            ["Tilted Downward", f"{pose_dist.get('Tilted Down', 0)}%", "Pitch < -10.0°"],
        ]
        pose_table = Table(pose_data, colWidths=[2.2*inch, 1.8*inch, 3.0*inch])
        pose_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_card])
        ]))
        elements.append(pose_table)
        elements.append(Spacer(1, 14))

        # 4. Gaze Direction Estimation
        elements.append(Paragraph("2. Approximate Gaze Direction Estimation", h2_style))
        elements.append(Paragraph("Geometric eye and iris landmark tracking. (Approximate indication, not eye-tracker hardware):", body_style))
        elements.append(Spacer(1, 4))

        gaze_dist = stats.get("gaze_distribution", {})
        gaze_data = [
            ["Gaze Category", "Percentage", "Avg Eye Aspect Ratio (EAR)"],
            ["Center / Forward", f"{gaze_dist.get('Center', 0)}%", f"{stats.get('mean_eye_aspect_ratio', 0):.3f}"],
            ["Leftward Shift", f"{gaze_dist.get('Left', 0)}%", "-"],
            ["Rightward Shift", f"{gaze_dist.get('Right', 0)}%", "-"],
            ["Upward Shift", f"{gaze_dist.get('Up', 0)}%", "-"],
            ["Downward Shift", f"{gaze_dist.get('Down', 0)}%", "-"],
            ["Eyes Closed / Blinking", f"{gaze_dist.get('Closed', 0)}%", "EAR < 0.20"],
        ]
        gaze_table = Table(gaze_data, colWidths=[2.5*inch, 2.0*inch, 2.5*inch])
        gaze_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_card])
        ]))
        elements.append(gaze_table)
        elements.append(Spacer(1, 14))

        # 5. Observable Facial Indicators
        elements.append(Paragraph("3. Observable Facial-Expression Indicators", h2_style))
        expr_data = [
            ["Indicator", "Observed Value", "Kinematic Basis"],
            ["Smile-related Movement", f"{stats.get('smile_frames_ratio', 0)}% of frames", "Bilateral mouth corner retraction & elevation"],
            ["Mouth / Jaw Separation", f"{stats.get('mouth_open_frames_ratio', 0)}% of frames", "Vertical lip distance and jaw separation"],
            ["Total Visual Events", f"{stats.get('total_events_detected', len(events))} events", "Debounced temporal state transitions"]
        ]
        expr_table = Table(expr_data, colWidths=[2.5*inch, 2.0*inch, 2.5*inch])
        expr_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_card])
        ]))
        elements.append(expr_table)
        elements.append(Spacer(1, 14))

        # 6. Chronological Events Log
        elements.append(Paragraph(f"4. Timestamped Visual Events ({len(events)} detected)", h2_style))
        if events:
            event_rows = [["Time", "Category", "Event Type", "Description"]]
            for ev in events[:25]: # top 25 in PDF
                m, s = divmod(ev.timestamp, 60)
                t_str = f"{int(m):02d}:{s:04.1f}"
                event_rows.append([
                    t_str,
                    ev.event_category.replace("_", " ").title(),
                    ev.event_type,
                    Paragraph(ev.event_description, small_style)
                ])
            ev_table = Table(event_rows, colWidths=[0.8*inch, 1.4*inch, 2.2*inch, 2.6*inch])
            ev_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('PADDING', (0, 0), (-1, -1), 4),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_card])
            ]))
            elements.append(ev_table)
            if len(events) > 25:
                elements.append(Spacer(1, 4))
                elements.append(Paragraph(f"... and {len(events) - 25} additional events in web dashboard.", small_style))
        else:
            elements.append(Paragraph("No significant debounced visual events recorded during this session.", body_style))

        elements.append(Spacer(1, 16))

        # 7. Scientific & Ethical Disclaimers Box
        disclaimer_text = (
            "<b>IMPORTANT ETHICAL & SCIENTIFIC NOTICE:</b> This report reflects observable surface kinematics "
            "(head angles, geometric landmark positions, and blendshape activations) extracted via computer vision. "
            "It does NOT evaluate, diagnose, or infer internal psychological conditions, emotions, mental health, "
            "personality, honesty, or cognitive intelligence. No facial recognition or personal identity profiling "
            "is performed."
        )
        disc_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[7.0*inch])
        disc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef3c7")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#f59e0b")),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(disc_table)

        doc.build(elements)
        return out_path

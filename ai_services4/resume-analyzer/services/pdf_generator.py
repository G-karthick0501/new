# ai_services4/resume-analyzer/services/pdf_generator.py

from weasyprint import HTML, CSS
from io import BytesIO
import re

def generate_ats_resume_pdf(resume_text: str, candidate_name: str = "Resume") -> bytes:
    """
    Generate ATS-friendly PDF from optimized resume text.
    Handles both well-formatted and poorly-formatted text.
    """
    
    # ✅ STEP 1: Clean and normalize the text first
    resume_text = normalize_resume_text(resume_text)
    
    # ✅ STEP 2: Parse into structured sections
    sections = parse_resume_sections(resume_text)
    
    # ✅ STEP 3: Build semantic HTML
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>{candidate_name}</title>
        {get_css()}
    </head>
    <body>
        {build_html_body(sections)}
    </body>
    </html>
    """
    
    # Generate PDF
    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    
    return pdf_buffer.getvalue()


def normalize_resume_text(text: str) -> str:
    """
    Clean and normalize resume text for better parsing.
    Fixes common formatting issues from AI-generated text.
    """
    # Remove excessive whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Fix section headers - ensure they're on separate lines
    section_keywords = [
        'SUMMARY', 'OBJECTIVE', 'EDUCATION', 'TECHNICAL SKILLS', 'SKILLS',
        'EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE',
        'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'AWARDS', 'ADDITIONAL SKILLS'
    ]
    
    for keyword in section_keywords:
        # Add newlines before section headers
        text = re.sub(f'([^\n]){keyword}', f'\\1\n\n{keyword}', text, flags=re.IGNORECASE)
        # Add newline after section header if not present
        text = re.sub(f'{keyword}([^\n:])', f'{keyword}\n\\1', text, flags=re.IGNORECASE)
    
    # Fix bullet points - ensure proper spacing
    text = re.sub(r'•\s*', '• ', text)
    text = re.sub(r'([^\n])•', r'\1\n•', text)
    
    # Fix pipes (used for separating contact info)
    text = re.sub(r'\s*\|\s*', ' | ', text)
    
    # Remove multiple consecutive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()


def parse_resume_sections(text: str) -> dict:
    """
    Parse resume text into structured sections.
    Handles messy, unformatted text from AI.
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    if not lines:
        return {'header': [], 'sections': []}
    
    sections = {
        'header': [],
        'sections': []
    }
    
    current_section = None
    current_subsection = None
    
    # Section keywords with variations
    section_patterns = {
        'SUMMARY': r'(SUMMARY|OBJECTIVE|PROFILE|PROFESSIONAL\s+SUMMARY)',
        'EDUCATION': r'(EDUCATION|ACADEMIC|QUALIFICATIONS?)',
        'SKILLS': r'(TECHNICAL\s+SKILLS?|SKILLS?|COMPETENCIES|EXPERTISE)',
        'EXPERIENCE': r'(EXPERIENCE|WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|EMPLOYMENT)',
        'PROJECTS': r'(PROJECTS?|PORTFOLIO)',
        'CERTIFICATIONS': r'(CERTIFICATIONS?|CERTIFICATES?|LICENSES?|ADDITIONAL\s+SKILLS?|AWARDS?)'
    }
    
    header_collected = False
    
    for i, line in enumerate(lines):
        line_upper = line.upper()
        
        # Check if this is a section header
        is_section_header = False
        matched_section = None
        
        for section_name, pattern in section_patterns.items():
            if re.match(f'^{pattern}$', line_upper.strip(':')) or re.search(pattern, line_upper):
                is_section_header = True
                matched_section = section_name
                break
        
        if is_section_header and matched_section:
            header_collected = True
            current_section = {
                'title': matched_section,
                'content': []
            }
            sections['sections'].append(current_section)
            current_subsection = None
            continue
        
        # Collect header (first 3-5 lines before any section)
        if not header_collected and len(sections['header']) < 5:
            sections['header'].append(line)
            continue
        
        # If no section started yet, add to header
        if current_section is None:
            if len(sections['header']) < 5:
                sections['header'].append(line)
            continue
        
        # Detect subsections (job titles, project names, institution names)
        is_subsection = False
        if not line.startswith(('•', '-', '*', '–')) and len(line) < 120:
            # Check if next line might be metadata (dates, location)
            next_line = lines[i + 1] if i + 1 < len(lines) else ''
            
            # Common patterns for subsection headers
            has_date_pattern = bool(re.search(r'20\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec', line + ' ' + next_line))
            has_pipe = '|' in line or '|' in next_line
            has_location = bool(re.search(r',\s*[A-Z]{2}|Remote|Pune|Mumbai|Bangalore|Delhi', line + ' ' + next_line))
            
            if has_date_pattern or has_pipe or (has_location and current_section['title'] in ['EXPERIENCE', 'EDUCATION']):
                is_subsection = True
        
        if is_subsection:
            current_subsection = {
                'title': line,
                'meta': '',
                'items': []
            }
            current_section['content'].append(current_subsection)
            continue
        
        # Bullet points
        if line.startswith(('•', '-', '*', '–')):
            content = line.lstrip('•-*– ').strip()
            if current_subsection:
                current_subsection['items'].append(content)
            else:
                current_section['content'].append({'bullet': content})
        # Regular text
        else:
            # If it looks like metadata for the previous subsection
            if current_subsection and not current_subsection['meta']:
                current_subsection['meta'] = line
            else:
                current_section['content'].append({'text': line})
    
    return sections


def build_html_body(sections: dict) -> str:
    """Build HTML body from parsed sections with clickable links"""
    html_parts = []
    
    # Header section
    if sections['header']:
        html_parts.append('<div class="header">')
        
        # First line is usually the name
        if sections['header']:
            name = sections['header'][0]
            html_parts.append(f'<h1>{escape_html(name)}</h1>')
        
        # Rest is contact info - make links clickable
        if len(sections['header']) > 1:
            html_parts.append('<div class="contact">')
            contact_lines = sections['header'][1:]
            
            for line in contact_lines:
                # Convert URLs to clickable links
                line_with_links = make_links_clickable(line)
                html_parts.append(line_with_links)
                if line != contact_lines[-1]:
                    html_parts.append(' ')
            
            html_parts.append('</div>')
        
        html_parts.append('</div>')
    
    # Content sections
    for section in sections['sections']:
        html_parts.append('<div class="section">')
        html_parts.append(f'<h2>{escape_html(section["title"])}</h2>')
        
        for item in section['content']:
            if isinstance(item, dict):
                # Subsection (job, project, education entry)
                if 'title' in item:
                    html_parts.append('<div class="subsection">')
                    # Make project links clickable
                    title_with_links = make_links_clickable(item["title"])
                    html_parts.append(f'<h3>{title_with_links}</h3>')
                    
                    if item.get('meta'):
                        html_parts.append(f'<div class="meta">{escape_html(item["meta"])}</div>')
                    
                    if item.get('items'):
                        html_parts.append('<ul>')
                        for bullet in item['items']:
                            html_parts.append(f'<li>{escape_html(bullet)}</li>')
                        html_parts.append('</ul>')
                    
                    html_parts.append('</div>')
                
                # Standalone bullet
                elif 'bullet' in item:
                    html_parts.append('<ul>')
                    html_parts.append(f'<li>{escape_html(item["bullet"])}</li>')
                    html_parts.append('</ul>')
                
                # Regular paragraph
                elif 'text' in item:
                    html_parts.append(f'<p>{escape_html(item["text"])}</p>')
        
        html_parts.append('</div>')
    
    return '\n'.join(html_parts)


def make_links_clickable(text: str) -> str:
    """Convert URLs and common link patterns to clickable HTML links"""
    if not text:
        return ""
    
    # Pattern 1: Full URLs (https://github.com/username)
    text = re.sub(
        r'(https?://[^\s<>"]+)',
        r'<a href="\1">\1</a>',
        text
    )
    
    # Pattern 2: Email addresses
    text = re.sub(
        r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b',
        r'<a href="mailto:\1">\1</a>',
        text
    )
    
    # Pattern 3: "GitHub" text near URL
    text = re.sub(
        r'GitHub\s*\|\s*<a href="(https://github\.com/[^"]+)">',
        r'<a href="\1">GitHub</a> | <a href="',
        text
    )
    
    # Pattern 4: "LinkedIn" text near URL
    text = re.sub(
        r'LinkedIn\s*(?:\||$)',
        lambda m: f'<a href="https://linkedin.com/in/yourprofile">LinkedIn</a>{m.group(0)[-1] if m.group(0)[-1] == "|" else ""}',
        text
    )
    
    return text


def escape_html(text: str) -> str:
    """Escape HTML special characters"""
    if not text:
        return ""
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#39;'))


def get_css() -> str:
    """Return embedded CSS for professional ATS-friendly formatting"""
    return """
    <style>
        @page {
            size: A4;
            margin: 0.75in;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Calibri', 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1a1a1a;
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #2c3e50;
        }
        
        .header h1 {
            font-size: 24pt;
            color: #2c3e50;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
        }
        
        .header .contact {
            font-size: 10pt;
            color: #555;
            line-height: 1.4;
        }
        
        /* Sections */
        .section {
            margin-top: 18px;
            margin-bottom: 12px;
        }
        
        .section h2 {
            font-size: 13pt;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 4px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        /* Subsections */
        .subsection {
            margin-top: 12px;
            margin-bottom: 12px;
        }
        
        .subsection h3 {
            font-size: 11.5pt;
            color: #2c3e50;
            margin-bottom: 3px;
            font-weight: 600;
        }
        
        .subsection .meta {
            font-size: 10pt;
            color: #666;
            font-style: italic;
            margin-bottom: 6px;
        }
        
        /* Lists */
        ul {
            margin: 6px 0 6px 20px;
            padding: 0;
        }
        
        li {
            margin: 4px 0;
            line-height: 1.4;
        }
        
        /* Paragraphs */
        p {
            margin: 6px 0;
            line-height: 1.5;
        }
        
        /* Links */
        a {
            color: #0066cc;
            text-decoration: none;
        }
        
        /* Print optimizations */
        @media print {
            body {
                font-size: 10.5pt;
            }
        }
    </style>
    """


# Export
__all__ = ['generate_ats_resume_pdf', 'parse_resume_sections']
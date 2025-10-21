from weasyprint import HTML, CSS
from io import BytesIO

class WeasyPrintGenerator:
    def __init__(self):
        print("✅ WeasyPrint PDF generator initialized")
    
    def generate_pdf(self, resume_data: dict) -> bytes:
        """Generate PDF from resume data using WeasyPrint"""
        try:
            html_content = self._generate_html(resume_data)
            css_content = self._get_css()
            
            print(f"📄 Generating PDF from HTML ({len(html_content)} chars)")
            
            # Generate PDF
            pdf_file = BytesIO()
            HTML(string=html_content).write_pdf(
                pdf_file,
                stylesheets=[CSS(string=css_content)]
            )
            
            pdf_bytes = pdf_file.getvalue()
            print(f"✅ PDF generated: {len(pdf_bytes)} bytes")
            
            return pdf_bytes
            
        except Exception as e:
            print(f"❌ PDF generation failed: {str(e)}")
            raise
    
    def _generate_html(self, data: dict) -> str:
        """Generate HTML from resume data"""
        
        html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
</head>
<body>
"""
        
        # Header
        name = data.get('name', 'Resume')
        email = data.get('email', '')
        phone = data.get('phone', '')
        location = data.get('location', '')
        github = data.get('github', '')
        linkedin = data.get('linkedin', '')
        
        html += f"""
<div class="header">
    <h1>{name}</h1>
    <div class="contact">
"""
        
        contact_items = []
        if email:
            contact_items.append(f'<a href="mailto:{email}">{email}</a>')
        if phone:
            contact_items.append(phone)
        if location:
            contact_items.append(location)
        
        if contact_items:
            html += " | ".join(contact_items) + "<br>"
        
        link_items = []
        if github:
            html += f'<a href="{github}">GitHub</a>'
        if linkedin:
            if github:
                html += " | "
            html += f'<a href="{linkedin}">LinkedIn</a>'
        
        html += """
    </div>
</div>
"""
        
        # Summary
        if data.get('summary'):
            html += f"""
<div class="section">
    <h2>Professional Summary</h2>
    <p>{data['summary']}</p>
</div>
"""
        
        # Education
        if data.get('education'):
            html += '<div class="section"><h2>Education</h2>'
            for edu in data['education']:
                html += f"""
<div class="entry">
    <div class="entry-header">
        <span class="title">{edu.get('institution', '')}</span>
        <span class="date">{edu.get('location', '')}</span>
    </div>
    <div class="entry-subheader">
        <span>{edu.get('degree', '')}</span>
        <span>{edu.get('dates', '')}</span>
    </div>
</div>
"""
            html += '</div>'
        
        # Skills
        if data.get('skills'):
            html += '<div class="section"><h2>Technical Skills</h2><ul class="skills">'
            for category, skills_list in data['skills'].items():
                skills_str = ", ".join(skills_list)
                html += f'<li><strong>{category}:</strong> {skills_str}</li>'
            html += '</ul></div>'
        
        # Experience
        if data.get('experience'):
            html += '<div class="section"><h2>Experience</h2>'
            for exp in data['experience']:
                html += f"""
<div class="entry">
    <div class="entry-header">
        <span class="title">{exp.get('title', '')}</span>
        <span class="date">{exp.get('dates', '')}</span>
    </div>
    <div class="entry-subheader">
        <span><em>{exp.get('company', '')}</em></span>
        <span>{exp.get('location', '')}</span>
    </div>
"""
                if exp.get('bullets'):
                    html += '<ul>'
                    for bullet in exp['bullets']:
                        html += f'<li>{bullet}</li>'
                    html += '</ul>'
                html += '</div>'
            html += '</div>'
        
        # Projects
        if data.get('projects'):
            html += '<div class="section"><h2>Projects</h2>'
            for proj in data['projects']:
                title = proj.get('name', '')
                if proj.get('link'):
                    title = f'<a href="{proj["link"]}">{title}</a>'
                
                html += f"""
<div class="entry">
    <div class="entry-header">
        <span class="title">{title}</span>
    </div>
"""
                if proj.get('bullets'):
                    html += '<ul>'
                    for bullet in proj['bullets']:
                        html += f'<li>{bullet}</li>'
                    html += '</ul>'
                html += '</div>'
            html += '</div>'
        
        # Certifications
        if data.get('certifications'):
            html += '<div class="section"><h2>Certifications</h2><ul class="certifications">'
            for cert in data['certifications']:
                html += f'<li>{cert}</li>'
            html += '</ul></div>'
        
        html += """
</body>
</html>
"""
        return html
    
    def _get_css(self) -> str:
        """Return CSS styling"""
        return """
@page {
    size: A4;
    margin: 0.75in;
}

body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #333;
}

.header {
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #333;
    padding-bottom: 10px;
}

.header h1 {
    font-size: 24pt;
    margin: 0 0 8px 0;
    font-weight: bold;
    color: #000;
}

.contact {
    font-size: 10pt;
    color: #666;
}

.contact a {
    color: #0066cc;
    text-decoration: none;
}

.section {
    margin-bottom: 18px;
}

.section h2 {
    font-size: 13pt;
    font-weight: bold;
    color: #000;
    margin: 0 0 8px 0;
    border-bottom: 1px solid #999;
    padding-bottom: 3px;
}

.entry {
    margin-bottom: 12px;
}

.entry-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
}

.entry-subheader {
    display: flex;
    justify-content: space-between;
    font-style: italic;
    color: #666;
    margin-bottom: 4px;
}

.title {
    font-weight: bold;
}

.date {
    color: #666;
}

ul {
    margin: 4px 0;
    padding-left: 20px;
}

li {
    margin-bottom: 3px;
}

.skills li {
    list-style: none;
    margin-bottom: 6px;
}

.certifications li {
    list-style: none;
    margin-bottom: 4px;
}

a {
    color: #0066cc;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}
"""
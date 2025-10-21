# ai_services4/resume-analyzer/services/latex_pdf_generator.py

import subprocess
import tempfile
import os
import shutil
from pathlib import Path
from typing import Dict

class LaTeXPDFGenerator:
    """
    Generate PDF from resume data using LaTeX template and Tectonic compiler.
    """
    
    def __init__(self):
        self.template_path = Path(__file__).parent.parent / 'templates' / 'resume_template.tex'
        self._check_tectonic()
    
    def _check_tectonic(self):
        """Verify Tectonic is installed."""
        try:
            result = subprocess.run(
                ['tectonic', '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                raise Exception("Tectonic not found")
            print(f"✅ Tectonic found: {result.stdout.strip()}")
        except Exception as e:
            raise Exception(f"Tectonic compiler not available: {e}")
    
    def generate_pdf(self, resume_data: Dict) -> bytes:
        """
        Generate PDF from structured resume data.
        
        Args:
            resume_data: Dict with parsed resume sections
        
        Returns:
            bytes: PDF file content
        """
        # Validate and clean data
        resume_data = self._validate_data(resume_data)
        
        # Load template
        with open(self.template_path, 'r', encoding='utf-8') as f:
            template = f.read()
        
        # Fill template with data
        latex_content = self._populate_template(template, resume_data)
        
        # Debug: print first 1000 chars
        print("📄 LaTeX content preview:")
        print(latex_content[:1000])
        
        # Compile to PDF
        pdf_bytes = self._compile_latex(latex_content)
        
        return pdf_bytes
    
    def _validate_data(self, data: Dict) -> Dict:
        """Validate and provide defaults for all fields"""
        validated = {
            'name': data.get('name') or 'Your Name',
            'email': data.get('email') or 'email@example.com',
            'phone': data.get('phone') or '1234567890',
            'location': data.get('location') or '',
            'github': data.get('github') or 'https://github.com',
            'linkedin': data.get('linkedin') or 'https://linkedin.com',
            'summary': data.get('summary') or '',
            'education': data.get('education') or [],
            'skills': data.get('skills') or {},
            'experience': data.get('experience') or [],
            'projects': data.get('projects') or [],
            'certifications': data.get('certifications') or []
        }
        
        # Ensure at least one item in each list
        if not validated['education']:
            validated['education'] = [{
                'institution': 'University',
                'degree': 'Degree',
                'location': 'Location',
                'dates': 'Dates'
            }]
        
        if not validated['skills']:
            validated['skills'] = {'General': ['Skills not specified']}
        
        return validated
    
    def _populate_template(self, template: str, data: Dict) -> str:
        """Replace template variables with actual data."""
        
        # Basic info
        template = template.replace('{{NAME}}', self._escape_latex(data['name']))
        template = template.replace('{{EMAIL}}', self._escape_latex(data['email']))
        template = template.replace('{{PHONE}}', self._escape_latex(data['phone']))
        template = template.replace('{{LOCATION}}', self._escape_latex(data['location']))
        
        # Links
        github_link = data['github']
        linkedin_link = data['linkedin']
        template = template.replace('{{GITHUB_LINK}}', f"\\href{{{github_link}}}{{\\underline{{GitHub}}}}")
        template = template.replace('{{LINKEDIN_LINK}}', f"\\href{{{linkedin_link}}}{{\\underline{{LinkedIn}}}}")
        
        # Summary
        summary = self._escape_latex(data['summary']) if data['summary'] else 'Professional summary not provided'
        template = template.replace('{{SUMMARY}}', summary)
        
        # Build sections
        education_latex = self._build_education(data['education'])
        skills_latex = self._build_skills(data['skills'])
        projects_latex = self._build_projects(data['projects'])
        experience_latex = self._build_experience(data['experience'])
        certs_latex = self._build_certifications(data['certifications'])
        
        template = template.replace('{{EDUCATION_CONTENT}}', education_latex)
        template = template.replace('{{SKILLS_CONTENT}}', skills_latex)
        template = template.replace('{{PROJECTS_CONTENT}}', projects_latex)
        template = template.replace('{{EXPERIENCE_CONTENT}}', experience_latex)
        template = template.replace('{{CERTIFICATIONS_CONTENT}}', certs_latex)
        
        return template
    
    def _build_education(self, education_list: list) -> str:
        """Build education section in LaTeX."""
        if not education_list:
            return "\\resumeSubheading{Education not provided}{}{}{}"
        
        items = []
        for edu in education_list:
            institution = self._escape_latex(edu.get('institution', ''))
            location = self._escape_latex(edu.get('location', ''))
            degree = self._escape_latex(edu.get('degree', ''))
            dates = self._escape_latex(edu.get('dates', ''))
            
            items.append(f"""\\resumeSubheading
      {{{institution}}}{{{location}}}
      {{{degree}}}{{{dates}}}""")
        
        return '\n    '.join(items)
    
    def _build_skills(self, skills: dict) -> str:
        """Build skills section in LaTeX."""
        if not skills:
            return "\\textbf{Skills}: Not specified \\\\"
        
        items = []
        for category, skill_list in skills.items():
            if not skill_list:  # Skip empty categories
                continue
            skills_str = ', '.join(skill_list)
            category_escaped = self._escape_latex(category)
            skills_escaped = self._escape_latex(skills_str)
            items.append(f"\\textbf{{{category_escaped}}}: {skills_escaped} \\\\")
        
        if not items:
            return "\\textbf{Skills}: Not specified \\\\"
        
        return '\n     '.join(items)
    
    def _build_projects(self, projects: list) -> str:
        """Build projects section in LaTeX."""
        if not projects:
            return "\\resumeProjectHeading{\\textbf{No projects listed}}{}"
        
        items = []
        for proj in projects:
            name = self._escape_latex(proj.get('name', 'Project'))
            link = proj.get('link', '#')
            
            items.append(f"""\\resumeProjectHeading
          {{\\textbf{{{name}}} $|$ \\href{{{link}}}{{\\underline{{Link}}}}}}{{}}
          \\resumeItemListStart""")
            
            bullets = proj.get('bullets', [])
            if not bullets:
                items.append("    \\resumeItem{Project description not provided}")
            else:
                for bullet in bullets:
                    bullet_escaped = self._escape_latex(bullet)
                    items.append(f"            \\resumeItem{{{bullet_escaped}}}")
            
            items.append("          \\resumeItemListEnd")
        
        return '\n      '.join(items)
    
    def _build_experience(self, experience: list) -> str:
        """Build experience section in LaTeX."""
        if not experience:
            return "\\resumeSubheading{No experience listed}{}{}{}"
        
        items = []
        for exp in experience:
            title = self._escape_latex(exp.get('title', ''))
            company = self._escape_latex(exp.get('company', ''))
            location = self._escape_latex(exp.get('location', ''))
            dates = self._escape_latex(exp.get('dates', ''))
            
            items.append(f"""\\resumeSubheading
      {{{title}}}{{{dates}}}
      {{{company}}}{{{location}}}
      \\resumeItemListStart""")
            
            bullets = exp.get('bullets', [])
            if not bullets:
                items.append("        \\resumeItem{Role description not provided}")
            else:
                for bullet in bullets:
                    bullet_escaped = self._escape_latex(bullet)
                    items.append(f"        \\resumeItem{{{bullet_escaped}}}")
            
            items.append("      \\resumeItemListEnd")
        
        return '\n    '.join(items)
    
    def _build_certifications(self, certifications: list) -> str:
        """Build certifications section in LaTeX - FIXED"""
        if not certifications:
            # Return empty string instead of items - will be handled by template
            return ""
        
        # Join all certifications as a single resumeItem
        certs_text = ' $\\cdot$ '.join([self._escape_latex(cert) for cert in certifications])
        return certs_text
    
    def _escape_latex(self, text: str) -> str:
        """Escape special LaTeX characters."""
        if not text:
            return ""
        
        # Convert to string if not already
        text = str(text)
        
        replacements = {
            '\\': r'\textbackslash{}',
            '&': r'\&',
            '%': r'\%',
            '$': r'\$',
            '#': r'\#',
            '_': r'\_',
            '{': r'\{',
            '}': r'\}',
            '~': r'\textasciitilde{}',
            '^': r'\textasciicircum{}'
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text
    
    def _compile_latex(self, latex_content: str) -> bytes:
        """Compile LaTeX to PDF using Tectonic."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_file = os.path.join(tmpdir, 'resume.tex')
            pdf_file = os.path.join(tmpdir, 'resume.pdf')
            
            # Write .tex file
            with open(tex_file, 'w', encoding='utf-8') as f:
                f.write(latex_content)
            
            print(f"📝 Compiling LaTeX in {tmpdir}")
            
            # Compile with Tectonic
            result = subprocess.run(
                ['tectonic', '-X', 'compile', tex_file, '--outdir', tmpdir],
                capture_output=True,
                text=True,
                timeout=180,
                cwd=tmpdir
            )
            
            if result.returncode != 0:
                print(f"❌ LaTeX compilation failed:")
                print(f"STDOUT: {result.stdout}")
                print(f"STDERR: {result.stderr}")
                
                # Save failed .tex for debugging (use Windows temp path)
                debug_file = os.path.join(tempfile.gettempdir(), 'failed_resume.tex')
                try:
                    shutil.copy(tex_file, debug_file)
                    print(f"💾 Failed .tex saved to: {debug_file}")
                except Exception as e:
                    print(f"⚠️  Could not save debug file: {e}")
                
                raise Exception(f"LaTeX compilation error: {result.stderr}")
            
            print(f"✅ PDF compiled successfully")
            
            # Read PDF
            if not os.path.exists(pdf_file):
                raise Exception("PDF file not generated")
            
            with open(pdf_file, 'rb') as f:
                pdf_bytes = f.read()
            
            print(f"📄 PDF size: {len(pdf_bytes)} bytes")
            
            return pdf_bytes


# Export
__all__ = ['LaTeXPDFGenerator']
import requests
import time

class OnlineLaTeXGenerator:
    def __init__(self):
        # Correct LaTeX.Online API URL
        self.api_url = "https://latexonline.cc/compile"
        print("✅ Online LaTeX generator initialized")
    
    def generate_pdf(self, resume_data: dict) -> bytes:
        """Generate PDF using LaTeX.Online API"""
        try:
            # Generate LaTeX content
            latex_content = self._generate_latex(resume_data)
            
            print("📤 Sending to LaTeX.Online...")
            print(f"📝 LaTeX content length: {len(latex_content)} chars")
            
            # Correct API call - send as URL parameter
            params = {
                'url': f"data:application/x-latex;base64,{self._encode_latex(latex_content)}"
            }
            
            response = requests.get(
                self.api_url,
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                print(f"✅ PDF generated: {len(response.content)} bytes")
                return response.content
            else:
                print(f"❌ API returned: {response.status_code}")
                print(f"Response: {response.text[:200]}")
                raise Exception(f"LaTeX compilation failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ LaTeX generation error: {str(e)}")
            raise
    
    def _encode_latex(self, latex: str) -> str:
        """Base64 encode LaTeX content"""
        import base64
        return base64.b64encode(latex.encode('utf-8')).decode('utf-8')
    
    def _generate_latex(self, data: dict) -> str:
        """Generate minimal LaTeX document"""
        
        # Simplified, minimal LaTeX
        name = self._escape_latex(data.get('name', 'Resume'))
        email = data.get('email', '')
        
        latex = r"""\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}
\pagestyle{empty}
\begin{document}

"""
        
        # Name
        latex += f"\\begin{{center}}\n{{\\Large \\textbf{{{name}}}}} \\\\\n"
        if email:
            latex += f"{email}\n"
        latex += "\\end{center}\n\n"
        
        # Summary
        if data.get('summary'):
            summary = self._escape_latex(data['summary'])
            latex += f"\\section*{{Summary}}\n{summary}\n\n"
        
        # Skills
        if data.get('skills'):
            latex += "\\section*{Skills}\n\\begin{itemize}\n"
            for category, skills_list in data['skills'].items():
                cat = self._escape_latex(category)
                skills = self._escape_latex(", ".join(skills_list))
                latex += f"\\item \\textbf{{{cat}:}} {skills}\n"
            latex += "\\end{itemize}\n\n"
        
        # Education
        if data.get('education'):
            latex += "\\section*{Education}\n"
            for edu in data['education']:
                inst = self._escape_latex(edu.get('institution', ''))
                degree = self._escape_latex(edu.get('degree', ''))
                latex += f"\\textbf{{{inst}}} \\\\\n{degree}\n\n"
        
        latex += "\\end{document}"
        
        return latex
    
    def _escape_latex(self, text: str) -> str:
        """Escape special LaTeX characters"""
        if not text:
            return ""
        
        replacements = {
            '&': r'\&',
            '%': r'\%',
            '$': r'\$',
            '#': r'\#',
            '_': r'\_',
            '{': r'\{',
            '}': r'\}',
            '~': r'\textasciitilde{}',
            '^': r'\^{}',
            '\\': r'\textbackslash{}'
        }
        
        for char, replacement in replacements.items():
            text = text.replace(char, replacement)
        
        return text
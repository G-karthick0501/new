# ai_services4/resume-analyzer/utils/resume_parser.py

import re
from typing import Dict, List

class ResumeParser:
    """
    Parse plain text resume into structured data for LaTeX template.
    Handles common resume sections and formats.
    """
    
    def __init__(self):
        self.section_keywords = {
            'education': ['EDUCATION', 'ACADEMIC', 'UNIVERSITY', 'COLLEGE'],
            'experience': ['EXPERIENCE', 'EMPLOYMENT', 'WORK HISTORY'],
            'projects': ['PROJECTS', 'PORTFOLIO'],
            'skills': ['SKILLS', 'TECHNICAL SKILLS', 'COMPETENCIES'],
            'certifications': ['CERTIFICATIONS', 'CERTIFICATES', 'ADDITIONAL SKILLS']
        }
    
    def parse(self, resume_text: str) -> Dict:
        """Main parsing function."""
        lines = [l.strip() for l in resume_text.split('\n') if l.strip()]
        
        data = {
            'name': '',
            'email': '',
            'phone': '',
            'location': '',
            'github': '',
            'linkedin': '',
            'summary': '',
            'education': [],
            'skills': {},
            'projects': [],
            'experience': [],
            'certifications': []
        }
        
        # Parse header (first 5 lines usually)
        self._parse_header(lines[:5], data)
        
        # Identify sections
        sections = self._identify_sections(lines)
        
        # Parse each section
        for section_name, section_lines in sections.items():
            if section_name == 'education':
                data['education'] = self._parse_education(section_lines)
            elif section_name == 'skills':
                data['skills'] = self._parse_skills(section_lines)
            elif section_name == 'projects':
                data['projects'] = self._parse_projects(section_lines)
            elif section_name == 'experience':
                data['experience'] = self._parse_experience(section_lines)
            elif section_name == 'certifications':
                data['certifications'] = self._parse_certifications(section_lines)
            elif section_name == 'summary' and not data['summary']:
                data['summary'] = ' '.join(section_lines)
        
        return data
    
    def _parse_header(self, lines: List[str], data: Dict):
        """Extract name, contact info from first few lines."""
        for line in lines:
            # Name (usually first line, all caps or title case)
            if not data['name'] and (line.isupper() or line.istitle()) and len(line.split()) <= 5:
                data['name'] = line.title()
            
            # Email
            if '@' in line and not data['email']:
                email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', line)
                if email_match:
                    data['email'] = email_match.group(0)
            
            # Phone
            if not data['phone']:
                phone_match = re.search(r'\b\d{10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', line)
                if phone_match:
                    data['phone'] = phone_match.group(0)
            
            # Location
            if any(state in line.upper() for state in ['MAHARASHTRA', 'PUNE', 'MUMBAI', 'DELHI']):
                data['location'] = line
            
            # GitHub
            if 'github' in line.lower():
                github_match = re.search(r'github\.com/[\w-]+', line.lower())
                if github_match:
                    data['github'] = f"https://{github_match.group(0)}"
            
            # LinkedIn
            if 'linkedin' in line.lower():
                data['linkedin'] = 'https://linkedin.com'  # Placeholder
    
    def _identify_sections(self, lines: List[str]) -> Dict[str, List[str]]:
        """Identify major sections in resume."""
        sections = {}
        current_section = 'header'
        current_lines = []
        
        for line in lines:
            line_upper = line.upper()
            
            # Check if this is a section header
            is_section_header = False
            section_name = None
            
            for section_type, keywords in self.section_keywords.items():
                for keyword in keywords:
                    if keyword in line_upper and len(line.split()) <= 5:
                        is_section_header = True
                        section_name = section_type
                        break
                if is_section_header:
                    break
            
            if is_section_header:
                # Save previous section
                if current_lines:
                    sections[current_section] = current_lines
                
                # Start new section
                current_section = section_name
                current_lines = []
            else:
                current_lines.append(line)
        
        # Save last section
        if current_lines:
            sections[current_section] = current_lines
        
        return sections
    
    def _parse_education(self, lines: List[str]) -> List[Dict]:
        """Parse education section."""
        education = []
        current_edu = {}
        
        for i, line in enumerate(lines):
            # Institution name (usually has university/institute/college)
            if any(word in line.lower() for word in ['university', 'institute', 'college']) and not current_edu.get('institution'):
                current_edu['institution'] = line
                
                # Next line might be location
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    if any(word in next_line.lower() for word in ['pune', 'mumbai', 'delhi', 'bangalore']):
                        current_edu['location'] = next_line
            
            # Degree
            if any(word in line.lower() for word in ['bachelor', 'master', 'b.tech', 'm.tech', 'bsc', 'msc']) and not current_edu.get('degree'):
                current_edu['degree'] = line
            
            # Dates (look for years)
            if re.search(r'20\d{2}', line) and not current_edu.get('dates'):
                current_edu['dates'] = line
            
            # If we have enough info, save and start new
            if len(current_edu) >= 3:
                education.append(current_edu)
                current_edu = {}
        
        # Save last one
        if current_edu:
            education.append(current_edu)
        
        return education
    
    def _parse_skills(self, lines: List[str]) -> Dict[str, List[str]]:
        """Parse skills section."""
        skills = {}
        
        for line in lines:
            # Look for category: skills format
            if ':' in line:
                parts = line.split(':', 1)
                category = parts[0].strip()
                skills_str = parts[1].strip()
                
                # Split skills by comma
                skill_list = [s.strip() for s in skills_str.split(',')]
                skills[category] = skill_list
        
        return skills
    
    def _parse_projects(self, lines: List[str]) -> List[Dict]:
        """Parse projects section."""
        projects = []
        current_project = {}
        current_bullets = []
        
        for line in lines:
            # Project name (usually has GitHub, bold, or is short)
            if 'github' in line.lower() or '|' in line:
                # Save previous project
                if current_project:
                    current_project['bullets'] = current_bullets
                    projects.append(current_project)
                
                # Start new project
                current_project = {'name': line.split('|')[0].strip(), 'link': '#'}
                current_bullets = []
            
            # Bullet points
            elif line.startswith(('•', '-', '*')) or (current_project and line):
                bullet = line.lstrip('•-* ').strip()
                if bullet:
                    current_bullets.append(bullet)
        
        # Save last project
        if current_project:
            current_project['bullets'] = current_bullets
            projects.append(current_project)
        
        return projects
    
    def _parse_experience(self, lines: List[str]) -> List[Dict]:
        """Parse experience section."""
        experience = []
        current_exp = {}
        current_bullets = []
        
        for i, line in enumerate(lines):
            # Job title (look for common titles or patterns)
            if any(word in line.lower() for word in ['intern', 'engineer', 'developer', 'analyst', 'manager']) and not current_exp.get('title'):
                current_exp['title'] = line
                
                # Next line might have dates
                if i + 1 < len(lines) and re.search(r'20\d{2}', lines[i + 1]):
                    current_exp['dates'] = lines[i + 1]
            
            # Company name (after title, before bullets)
            elif current_exp.get('title') and not current_exp.get('company') and not line.startswith(('•', '-', '*')):
                current_exp['company'] = line
            
            # Bullet points
            elif line.startswith(('•', '-', '*')):
                bullet = line.lstrip('•-* ').strip()
                if bullet:
                    current_bullets.append(bullet)
        
        # Save experience
        if current_exp:
            current_exp['bullets'] = current_bullets
            current_exp['location'] = current_exp.get('location', 'Remote')
            experience.append(current_exp)
        
        return experience
    
    def _parse_certifications(self, lines: List[str]) -> List[str]:
        """Parse certifications."""
        certs = []
        for line in lines:
            if line.startswith(('•', '-', '*')) or line:
                cert = line.lstrip('•-* ').strip()
                if cert:
                    certs.append(cert)
        return certs


# Export
__all__ = ['ResumeParser']
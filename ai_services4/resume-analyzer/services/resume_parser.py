"""
Resume Text Parser
Converts plain text optimized resume into structured data for LaTeX template
"""

import re
from typing import Dict, List, Optional

class ResumeParser:
    """Parse optimized resume text into structured format."""
    
    def __init__(self):
        self.section_keywords = {
            'education': ['EDUCATION', 'ACADEMIC', 'QUALIFICATION'],
            'skills': ['SKILLS', 'TECHNICAL SKILLS', 'COMPETENCIES'],
            'projects': ['PROJECTS', 'PROJECT'],
            'experience': ['EXPERIENCE', 'WORK EXPERIENCE', 'EMPLOYMENT'],
            'certifications': ['CERTIFICATION', 'ADDITIONAL SKILLS', 'AWARDS']
        }
    
    def parse(self, resume_text: str) -> Dict:
        """
        Main parsing function.
        Returns structured resume data.
        """
        lines = [l.strip() for l in resume_text.split('\n') if l.strip()]
        
        data = {
            'name': '',
            'email': '',
            'phone': '',
            'location': '',
            'github': 'https://github.com',
            'linkedin': 'https://linkedin.com',
            'summary': '',
            'education': [],
            'skills': {},
            'projects': [],
            'experience': [],
            'certifications': []
        }
        
        # Extract header info (first 5 lines usually)
        self._parse_header(lines[:10], data)
        
        # Find sections
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
        """Extract name, contact info from header."""
        # Name is usually first line (all caps or title case)
        if lines:
            data['name'] = lines[0]
        
        # Look for email, phone, location in first few lines
        for line in lines[:10]:
            # Email
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', line)
            if email_match:
                data['email'] = email_match.group(0)
            
            # Phone (various formats)
            phone_match = re.search(r'[\d\s\-\(\)]{10,}', line)
            if phone_match and len(re.findall(r'\d', phone_match.group(0))) >= 10:
                data['phone'] = phone_match.group(0).strip()
            
            # Location (look for city, state patterns)
            if any(word in line.upper() for word in ['PUNE', 'MUMBAI', 'DELHI', 'BANGALORE']):
                data['location'] = line
            
            # GitHub
            if 'github.com' in line.lower():
                github_match = re.search(r'https?://github\.com/[\w\-]+', line, re.IGNORECASE)
                if github_match:
                    data['github'] = github_match.group(0)
            
            # LinkedIn
            if 'linkedin.com' in line.lower():
                linkedin_match = re.search(r'https?://(?:www\.)?linkedin\.com/[\w\-/]+', line, re.IGNORECASE)
                if linkedin_match:
                    data['linkedin'] = linkedin_match.group(0)
        
        # Extract summary (text between header and first section)
        summary_lines = []
        for line in lines:
            if self._is_section_header(line):
                break
            if line and not any(x in line for x in ['@', 'http', data['phone']]):
                summary_lines.append(line)
        
        if len(summary_lines) > 1:
            data['summary'] = ' '.join(summary_lines[1:])  # Skip name
    
    def _identify_sections(self, lines: List[str]) -> Dict[str, List[str]]:
        """Identify and extract sections from resume."""
        sections = {}
        current_section = None
        current_lines = []
        
        for line in lines:
            if self._is_section_header(line):
                # Save previous section
                if current_section:
                    sections[current_section] = current_lines
                
                # Start new section
                current_section = self._get_section_type(line)
                current_lines = []
            else:
                if current_section:
                    current_lines.append(line)
        
        # Save last section
        if current_section:
            sections[current_section] = current_lines
        
        return sections
    
    def _is_section_header(self, line: str) -> bool:
        """Check if line is a section header."""
        line_upper = line.upper()
        
        # Common patterns for section headers
        if line.isupper() and len(line) < 50:
            return True
        
        if line.endswith(':') and len(line) < 50:
            return True
        
        # Check against known keywords
        for keywords in self.section_keywords.values():
            if any(kw in line_upper for kw in keywords):
                return True
        
        return False
    
    def _get_section_type(self, line: str) -> str:
        """Determine section type from header."""
        line_upper = line.upper()
        
        for section_type, keywords in self.section_keywords.items():
            if any(kw in line_upper for kw in keywords):
                return section_type
        
        return 'other'
    
    def _parse_education(self, lines: List[str]) -> List[Dict]:
        """Parse education section."""
        education = []
        current_edu = None
        
        for line in lines:
            # Institution line (usually has university/college/institute)
            if any(word in line.lower() for word in ['university', 'institute', 'college', 'school']):
                if current_edu:
                    education.append(current_edu)
                
                current_edu = {
                    'institution': line.split('|')[0].strip() if '|' in line else line.strip(),
                    'location': '',
                    'degree': '',
                    'dates': ''
                }
                
                # Check if location is on same line
                if '|' in line:
                    parts = line.split('|')
                    if len(parts) > 1:
                        current_edu['location'] = parts[1].strip()
            
            # Degree line
            elif current_edu and ('bachelor' in line.lower() or 'master' in line.lower() or 'b.tech' in line.lower()):
                current_edu['degree'] = line.split('|')[0].strip() if '|' in line else line.strip()
                
                # Check for dates on same line
                date_match = re.search(r'(20\d{2}\s*[-–]\s*20\d{2}|20\d{2}\s*[-–]\s*Present)', line)
                if date_match:
                    current_edu['dates'] = date_match.group(0)
        
        if current_edu:
            education.append(current_edu)
        
        return education
    
    def _parse_skills(self, lines: List[str]) -> Dict[str, List[str]]:
        """Parse skills section."""
        skills = {}
        
        for line in lines:
            # Look for category: skills pattern
            if ':' in line:
                parts = line.split(':', 1)
                category = parts[0].strip()
                skills_list = [s.strip() for s in parts[1].split(',')]
                skills[category] = skills_list
            elif ',' in line:
                # No category, general skills
                if 'General' not in skills:
                    skills['General'] = []
                skills['General'].extend([s.strip() for s in line.split(',')])
        
        return skills
    
    def _parse_projects(self, lines: List[str]) -> List[Dict]:
        """Parse projects section."""
        projects = []
        current_project = None
        
        for line in lines:
            # Project title (usually short, may have GitHub link)
            if len(line) < 100 and not line.startswith(('•', '-', '*')) and (
                'github' in line.lower() or 
                '|' in line or 
                (current_project is None and len(projects) < 5)
            ):
                if current_project:
                    projects.append(current_project)
                
                # Extract GitHub link if present
                github_link = '#'
                if 'github' in line.lower():
                    github_match = re.search(r'https?://github\.com/[\w\-/]+', line, re.IGNORECASE)
                    if github_match:
                        github_link = github_match.group(0)
                
                current_project = {
                    'name': line.split('|')[0].replace('GitHub', '').strip(),
                    'link': github_link,
                    'bullets': []
                }
            
            # Bullet points
            elif current_project and line.startswith(('•', '-', '*')):
                bullet = line.lstrip('•-* ').strip()
                current_project['bullets'].append(bullet)
            
            # Tech stack line
            elif current_project and ('tech:' in line.lower() or 'technologies:' in line.lower()):
                current_project['tech'] = line.split(':', 1)[1].strip()
        
        if current_project:
            projects.append(current_project)
        
        return projects
    
    def _parse_experience(self, lines: List[str]) -> List[Dict]:
        """Parse experience section."""
        experience = []
        current_exp = None
        
        for line in lines:
            # Job title/company line
            if len(line) < 100 and not line.startswith(('•', '-', '*')) and (
                any(word in line.lower() for word in ['intern', 'engineer', 'developer', 'manager', 'analyst']) or
                (current_exp is None and len(experience) < 5)
            ):
                if current_exp:
                    experience.append(current_exp)
                
                # Check for dates
                date_match = re.search(r'(20\d{2}\s*[-–]\s*20\d{2}|20\d{2}\s*[-–]\s*Present|\w+\s+20\d{2}\s*[-–]\s*\w+\s+20\d{2})', line)
                dates = date_match.group(0) if date_match else ''
                
                current_exp = {
                    'title': line.split('|')[0].strip() if '|' in line else line.strip(),
                    'company': '',
                    'location': '',
                    'dates': dates,
                    'bullets': []
                }
            
            # Company line (next line after title)
            elif current_exp and not current_exp['company'] and not line.startswith(('•', '-', '*')):
                parts = line.split('|') if '|' in line else [line]
                current_exp['company'] = parts[0].strip()
                if len(parts) > 1:
                    current_exp['location'] = parts[1].strip()
            
            # Bullet points
            elif current_exp and line.startswith(('•', '-', '*')):
                bullet = line.lstrip('•-* ').strip()
                current_exp['bullets'].append(bullet)
        
        if current_exp:
            experience.append(current_exp)
        
        return experience
    
    def _parse_certifications(self, lines: List[str]) -> List[str]:
        """Parse certifications section."""
        certifications = []
        
        for line in lines:
            if line.startswith(('•', '-', '*')):
                cert = line.lstrip('•-* ').strip()
                certifications.append(cert)
            elif line and not self._is_section_header(line):
                certifications.append(line)
        
        return certifications


# Export
__all__ = ['ResumeParser']